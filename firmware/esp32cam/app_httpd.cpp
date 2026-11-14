// Copyright 2015-2016 Espressif Systems (Shanghai) PTE LTD
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "Arduino.h"
#include "esp_http_server.h"
#include "esp_timer.h"
#include "esp_camera.h"
#include "img_converters.h"
#include "fb_gfx.h"
#include "esp32-hal-ledc.h"
#include "sdkconfig.h"
#include "camera_index.h"
#include "board_config.h"
#include <Preferences.h>

#if defined(ARDUINO_ARCH_ESP32) && defined(CONFIG_ARDUHAL_ESP_LOG)
#include "esp32-hal-log.h"
#endif

// LED FLASH setup
#if defined(LED_GPIO_NUM)
#define CONFIG_LED_MAX_INTENSITY 255

int led_duty = 0;
bool isStreaming = false;

#endif

typedef struct {
  httpd_req_t *req;
  size_t len;
} jpg_chunking_t;

#define PART_BOUNDARY "123456789000000000000987654321"
static const char *_STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *_STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *_STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\nX-Timestamp: %d.%06d\r\n\r\n";

httpd_handle_t stream_httpd = NULL;
httpd_handle_t camera_httpd = NULL;

// ---- Settings for sensors without hardware JPEG (e.g. GC2145) ----
// The page's Quality slider (lower = better, like OV2640) drives software JPEG quality.
// Resolution changes need new frame buffers, so they are saved and the camera restarts.
int sw_quality_slider = 30;  // set from saved settings at boot (see esp32cam.ino)
#define MAX_STREAM_FPS 10      // enough for doorway counting; less heat than running flat out
static int sw_jpeg_quality() {
  // Map slider 4 (best) .. 63 (worst) to JPEG quality 95 .. 10.
  int q = 95 - ((sw_quality_slider - 4) * 85) / 59;
  return q < 10 ? 10 : (q > 95 ? 95 : q);
}
// Grayscale mode (Special Effect = Grayscale on the page): send only the brightness (Y)
// of YUV422 frames. Encoding one channel instead of three is much faster.
bool sw_grayscale = false;  // set from saved settings at boot (see esp32cam.ino)
static uint8_t *gray_buf = NULL;
static size_t gray_buf_size = 0;
static int y_offset = -1;  // 0 or 1: which byte of each YUV422 pair holds Y (detected once)

static int detect_y_offset(const uint8_t *buf, size_t len) {
  // Chroma (U/V) bytes sit near 128 with little spread; Y varies much more.
  long long sum[2] = {0, 0}, sq[2] = {0, 0};
  size_t n = 0;
  for (size_t i = 0; i + 1 < len && n < 20000; i += 2, n++) {
    for (int k = 0; k < 2; k++) {
      int v = buf[i + k];
      sum[k] += v;
      sq[k] += v * v;
    }
  }
  if (!n) return 0;
  double var0 = (double)sq[0] / n - ((double)sum[0] / n) * ((double)sum[0] / n);
  double var1 = (double)sq[1] / n - ((double)sum[1] / n) * ((double)sum[1] / n);
  return var1 > var0 ? 1 : 0;
}

static bool yuv_to_gray_jpeg(camera_fb_t *fb, int quality, uint8_t **out, size_t *out_len) {
  size_t pixels = fb->width * fb->height;
  if (gray_buf_size < pixels) {
    free(gray_buf);
    gray_buf = (uint8_t *)ps_malloc(pixels);
    gray_buf_size = gray_buf ? pixels : 0;
    if (!gray_buf) return false;
  }
  if (y_offset < 0) y_offset = detect_y_offset(fb->buf, fb->len);
  const uint8_t *src = fb->buf + y_offset;
  for (size_t i = 0; i < pixels; i++) gray_buf[i] = src[i * 2];
  return fmt2jpg(gray_buf, pixels, fb->width, fb->height, PIXFORMAT_GRAYSCALE, quality, out, out_len);
}

static void restart_cb(void *) {
  esp_restart();
}
static void restart_soon() {
  static esp_timer_handle_t timer = NULL;
  if (!timer) {
    const esp_timer_create_args_t args = {.callback = &restart_cb, .arg = NULL, .dispatch_method = ESP_TIMER_TASK, .name = "restart"};
    esp_timer_create(&args, &timer);
  }
  esp_timer_start_once(timer, 500 * 1000);  // let the HTTP reply go out first
}

typedef struct {
  size_t size;   //number of values used for filtering
  size_t index;  //current value index
  size_t count;  //value count
  int sum;
  int *values;  //array to be filled with values
} ra_filter_t;

static ra_filter_t ra_filter;

static ra_filter_t *ra_filter_init(ra_filter_t *filter, size_t sample_size) {
  memset(filter, 0, sizeof(ra_filter_t));

  filter->values = (int *)malloc(sample_size * sizeof(int));
  if (!filter->values) {
    return NULL;
  }
  memset(filter->values, 0, sample_size * sizeof(int));

  filter->size = sample_size;
  return filter;
}

#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
static int ra_filter_run(ra_filter_t *filter, int value) {
  if (!filter->values) {
    return value;
  }
  filter->sum -= filter->values[filter->index];
  filter->values[filter->index] = value;
  filter->sum += filter->values[filter->index];
  filter->index++;
  filter->index = filter->index % filter->size;
  if (filter->count < filter->size) {
    filter->count++;
  }
  return filter->sum / filter->count;
}
#endif

#if defined(LED_GPIO_NUM)
void enable_led(bool en) {  // Turn LED On or Off
  int duty = en ? led_duty : 0;
  if (en && isStreaming && (led_duty > CONFIG_LED_MAX_INTENSITY)) {
    duty = CONFIG_LED_MAX_INTENSITY;
  }
  ledcWrite(LED_GPIO_NUM, duty);
  //ledc_set_duty(CONFIG_LED_LEDC_SPEED_MODE, CONFIG_LED_LEDC_CHANNEL, duty);
  //ledc_update_duty(CONFIG_LED_LEDC_SPEED_MODE, CONFIG_LED_LEDC_CHANNEL);
  log_i("Set LED intensity to %d", duty);
}
#endif

static esp_err_t bmp_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
  int64_t fr_start = esp_timer_get_time();
#endif
  fb = esp_camera_fb_get();
  if (!fb) {
    log_e("Camera capture failed");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/x-windows-bmp");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.bmp");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  char ts[32];
  // Cast to uint32_t is safe until year 2106.
  snprintf(ts, 32, "%" PRIu32 ".%06" PRIu32, (uint32_t)fb->timestamp.tv_sec, (uint32_t)fb->timestamp.tv_usec);
  httpd_resp_set_hdr(req, "X-Timestamp", (const char *)ts);

  uint8_t *buf = NULL;
  size_t buf_len = 0;
  bool converted = frame2bmp(fb, &buf, &buf_len);
  esp_camera_fb_return(fb);
  if (!converted) {
    log_e("BMP Conversion failed");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  res = httpd_resp_send(req, (const char *)buf, buf_len);
  free(buf);
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
  int64_t fr_end = esp_timer_get_time();
#endif
  log_i("BMP: %" PRId32 "ms, %" PRIu32 "B", (int32_t)((fr_end - fr_start) / 1000), (uint32_t)buf_len);
  return res;
}

static size_t jpg_encode_stream(void *arg, size_t index, const void *data, size_t len) {
  jpg_chunking_t *j = (jpg_chunking_t *)arg;
  if (!index) {
    j->len = 0;
  }
  if (httpd_resp_send_chunk(j->req, (const char *)data, len) != ESP_OK) {
    return 0;
  }
  j->len += len;
  return len;
}

static esp_err_t capture_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
  int64_t fr_start = esp_timer_get_time();
#endif

#if defined(LED_GPIO_NUM)
  enable_led(true);
  vTaskDelay(150 / portTICK_PERIOD_MS);  // The LED needs to be turned on ~150ms before the call to esp_camera_fb_get()
  fb = esp_camera_fb_get();              // or it won't be visible in the frame. A better way to do this is needed.
  enable_led(false);
#else
  fb = esp_camera_fb_get();
#endif

  if (!fb) {
    log_e("Camera capture failed");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  char ts[32];
  // Cast to uint32_t is safe until year 2106.
  snprintf(ts, 32, "%" PRIu32 ".%06" PRIu32, (uint32_t)fb->timestamp.tv_sec, (uint32_t)fb->timestamp.tv_usec);
  httpd_resp_set_hdr(req, "X-Timestamp", (const char *)ts);

#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
  size_t fb_len = 0;
#endif
  if (fb->format == PIXFORMAT_JPEG) {
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
    fb_len = fb->len;
#endif
    res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  } else {
    jpg_chunking_t jchunk = {req, 0};
    res = frame2jpg_cb(fb, 80, jpg_encode_stream, &jchunk) ? ESP_OK : ESP_FAIL;
    httpd_resp_send_chunk(req, NULL, 0);
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
    fb_len = jchunk.len;
#endif
  }
  esp_camera_fb_return(fb);
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
  int64_t fr_end = esp_timer_get_time();
#endif
  log_i("JPG: %" PRIu32 "B %" PRId32 " ms", (uint32_t)fb_len, (int32_t)((fr_end - fr_start) / 1000));
  return res;
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  struct timeval _timestamp;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t *_jpg_buf = NULL;
  char *part_buf[128];

  static int64_t last_frame = 0;
  if (!last_frame) {
    last_frame = esp_timer_get_time();
  }

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) {
    return res;
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "X-Framerate", "60");

#if defined(LED_GPIO_NUM)
  isStreaming = true;
  enable_led(true);
#endif

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      log_e("Camera capture failed");
      res = ESP_FAIL;
    } else {
      _timestamp.tv_sec = fb->timestamp.tv_sec;
      _timestamp.tv_usec = fb->timestamp.tv_usec;
      if (fb->format != PIXFORMAT_JPEG) {
        // Software JPEG for sensors without hardware JPEG. Lower quality = faster encoding and smaller frames.
        bool jpeg_converted = (sw_grayscale && fb->format == PIXFORMAT_YUV422)
                                ? yuv_to_gray_jpeg(fb, sw_jpeg_quality(), &_jpg_buf, &_jpg_buf_len)
                                : frame2jpg(fb, sw_jpeg_quality(), &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if (!jpeg_converted) {
          log_e("JPEG compression failed");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 128, _STREAM_PART, _jpg_buf_len, _timestamp.tv_sec, _timestamp.tv_usec);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if (res != ESP_OK) {
      log_e("Send frame failed");
      break;
    }
    // Cap the stream at MAX_STREAM_FPS. The counter does not need more, and every extra
    // software-JPEG frame keeps the CPU at 100% and heats the board.
    const int64_t min_frame_us = 1000000 / MAX_STREAM_FPS;
    int64_t spent_us = esp_timer_get_time() - last_frame;
    if (spent_us < min_frame_us) {
      vTaskDelay(pdMS_TO_TICKS((min_frame_us - spent_us) / 1000));
    }
    int64_t fr_end = esp_timer_get_time();

    int64_t frame_time = fr_end - last_frame;
    last_frame = fr_end;

    frame_time /= 1000;
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
    uint32_t avg_frame_time = ra_filter_run(&ra_filter, frame_time);
#endif
    log_i(
      "MJPG: %" PRIu32 "B %" PRId32 "ms (%.1ffps), AVG: %" PRIu32 "ms (%.1ffps)", (uint32_t)_jpg_buf_len, (int32_t)frame_time, 1000.0 / frame_time,
      avg_frame_time, 1000.0 / avg_frame_time
    );
  }

#if defined(LED_GPIO_NUM)
  isStreaming = false;
  enable_led(false);
#endif

  return res;
}

static esp_err_t parse_get(httpd_req_t *req, char **obuf) {
  char *buf = NULL;
  size_t buf_len = 0;

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char *)malloc(buf_len);
    if (!buf) {
      httpd_resp_send_500(req);
      return ESP_FAIL;
    }
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      *obuf = buf;
      return ESP_OK;
    }
    free(buf);
  }
  httpd_resp_send_404(req);
  return ESP_FAIL;
}

static esp_err_t cmd_handler(httpd_req_t *req) {
  char *buf = NULL;
  char variable[32];
  char value[32];

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }
  if (httpd_query_key_value(buf, "var", variable, sizeof(variable)) != ESP_OK || httpd_query_key_value(buf, "val", value, sizeof(value)) != ESP_OK) {
    free(buf);
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }
  free(buf);

  int val = atoi(value);
  log_i("%s = %d", variable, val);
  sensor_t *s = esp_camera_sensor_get();
  int res = 0;

  if (!strcmp(variable, "framesize")) {
    if (s->pixformat == PIXFORMAT_JPEG) {
      res = s->set_framesize(s, (framesize_t)val);
    } else if (val >= 0 && val <= FRAMESIZE_VGA) {
      Preferences prefs;
      prefs.begin("cam", false);
      prefs.putInt("fs", val);
      prefs.end();
      log_i("Raw sensor: saved framesize %d, restarting", val);
      restart_soon();
    } else {
      res = -1;  // larger than VGA is too slow/heavy for software JPEG
    }
  } else if (!strcmp(variable, "quality")) {
    if (s->pixformat == PIXFORMAT_JPEG) {
      res = s->set_quality(s, val);
    } else {
      sw_quality_slider = val;
      Preferences prefs;
      prefs.begin("cam", false);
      prefs.putInt("q", val);
      prefs.end();
    }
  } else if (!strcmp(variable, "contrast")) {
    res = s->set_contrast(s, val);
  } else if (!strcmp(variable, "brightness")) {
    res = s->set_brightness(s, val);
  } else if (!strcmp(variable, "saturation")) {
    res = s->set_saturation(s, val);
  } else if (!strcmp(variable, "gainceiling")) {
    res = s->set_gainceiling(s, (gainceiling_t)val);
  } else if (!strcmp(variable, "colorbar")) {
    res = s->set_colorbar(s, val);
  } else if (!strcmp(variable, "awb")) {
    res = s->set_whitebal(s, val);
  } else if (!strcmp(variable, "agc")) {
    res = s->set_gain_ctrl(s, val);
  } else if (!strcmp(variable, "aec")) {
    res = s->set_exposure_ctrl(s, val);
  } else if (!strcmp(variable, "hmirror")) {
    res = s->set_hmirror(s, val);
  } else if (!strcmp(variable, "vflip")) {
    res = s->set_vflip(s, val);
  } else if (!strcmp(variable, "awb_gain")) {
    res = s->set_awb_gain(s, val);
  } else if (!strcmp(variable, "agc_gain")) {
    res = s->set_agc_gain(s, val);
  } else if (!strcmp(variable, "aec_value")) {
    res = s->set_aec_value(s, val);
  } else if (!strcmp(variable, "aec2")) {
    res = s->set_aec2(s, val);
  } else if (!strcmp(variable, "dcw")) {
    res = s->set_dcw(s, val);
  } else if (!strcmp(variable, "bpc")) {
    res = s->set_bpc(s, val);
  } else if (!strcmp(variable, "wpc")) {
    res = s->set_wpc(s, val);
  } else if (!strcmp(variable, "raw_gma")) {
    res = s->set_raw_gma(s, val);
  } else if (!strcmp(variable, "lenc")) {
    res = s->set_lenc(s, val);
  } else if (!strcmp(variable, "special_effect")) {
    if (s->pixformat == PIXFORMAT_JPEG) {
      res = s->set_special_effect(s, val);
    } else {
      // Raw sensor: 2 = Grayscale switches the fast software grayscale stream on, anything else off.
      sw_grayscale = (val == 2);
      Preferences prefs;
      prefs.begin("cam", false);
      prefs.putBool("gray", sw_grayscale);
      prefs.end();
    }
  } else if (!strcmp(variable, "wb_mode")) {
    res = s->set_wb_mode(s, val);
  } else if (!strcmp(variable, "ae_level")) {
    res = s->set_ae_level(s, val);
  }
#if defined(LED_GPIO_NUM)
  else if (!strcmp(variable, "led_intensity")) {
    led_duty = val;
    if (isStreaming) {
      enable_led(true);
    }
  }
#endif
  else {
    log_i("Unknown command: %s", variable);
    res = -1;
  }

  if (res < 0) {
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

static int print_reg(char *p, char *end, sensor_t *s, uint16_t reg, uint32_t mask) {
  return snprintf(p, end - p, "\"0x%04x\":%d,", reg, s->get_reg(s, reg, mask));
}

static esp_err_t status_handler(httpd_req_t *req) {
  static char json_response[1024];

  sensor_t *s = esp_camera_sensor_get();
  char *p = json_response;
  char *end = json_response + sizeof(json_response);
  *p++ = '{';

  if (s->id.PID == OV5640_PID || s->id.PID == OV3660_PID) {
    for (int reg = 0x3400; reg < 0x3406; reg += 2) {
      p += print_reg(p, end, s, reg, 0xFFF);  //12 bit
    }
    p += print_reg(p, end, s, 0x3406, 0xFF);

    p += print_reg(p, end, s, 0x3500, 0xFFFF0);  //16 bit
    p += print_reg(p, end, s, 0x3503, 0xFF);
    p += print_reg(p, end, s, 0x350a, 0x3FF);   //10 bit
    p += print_reg(p, end, s, 0x350c, 0xFFFF);  //16 bit

    for (int reg = 0x5480; reg <= 0x5490; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }

    for (int reg = 0x5380; reg <= 0x538b; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }

    for (int reg = 0x5580; reg < 0x558a; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }
    p += print_reg(p, end, s, 0x558a, 0x1FF);  //9 bit
  } else if (s->id.PID == OV2640_PID) {
    p += print_reg(p, end, s, 0xd3, 0xFF);
    p += print_reg(p, end, s, 0x111, 0xFF);
    p += print_reg(p, end, s, 0x132, 0xFF);
  }

  p += snprintf(p, end - p, "\"xclk\":%u,", s->xclk_freq_hz / 1000000);
  p += snprintf(p, end - p, "\"pixformat\":%u,", s->pixformat);
  p += snprintf(p, end - p, "\"framesize\":%u,", s->status.framesize);
  p += snprintf(p, end - p, "\"quality\":%u,", s->pixformat == PIXFORMAT_JPEG ? s->status.quality : sw_quality_slider);
  p += snprintf(p, end - p, "\"brightness\":%d,", s->status.brightness);
  p += snprintf(p, end - p, "\"contrast\":%d,", s->status.contrast);
  p += snprintf(p, end - p, "\"saturation\":%d,", s->status.saturation);
  p += snprintf(p, end - p, "\"sharpness\":%d,", s->status.sharpness);
  p += snprintf(p, end - p, "\"special_effect\":%u,", s->pixformat == PIXFORMAT_JPEG ? s->status.special_effect : (sw_grayscale ? 2 : 0));
  p += snprintf(p, end - p, "\"wb_mode\":%u,", s->status.wb_mode);
  p += snprintf(p, end - p, "\"awb\":%u,", s->status.awb);
  p += snprintf(p, end - p, "\"awb_gain\":%u,", s->status.awb_gain);
  p += snprintf(p, end - p, "\"aec\":%u,", s->status.aec);
  p += snprintf(p, end - p, "\"aec2\":%u,", s->status.aec2);
  p += snprintf(p, end - p, "\"ae_level\":%d,", s->status.ae_level);
  p += snprintf(p, end - p, "\"aec_value\":%u,", s->status.aec_value);
  p += snprintf(p, end - p, "\"agc\":%u,", s->status.agc);
  p += snprintf(p, end - p, "\"agc_gain\":%u,", s->status.agc_gain);
  p += snprintf(p, end - p, "\"gainceiling\":%u,", s->status.gainceiling);
  p += snprintf(p, end - p, "\"bpc\":%u,", s->status.bpc);
  p += snprintf(p, end - p, "\"wpc\":%u,", s->status.wpc);
  p += snprintf(p, end - p, "\"raw_gma\":%u,", s->status.raw_gma);
  p += snprintf(p, end - p, "\"lenc\":%u,", s->status.lenc);
  p += snprintf(p, end - p, "\"hmirror\":%u,", s->status.hmirror);
  p += snprintf(p, end - p, "\"vflip\":%u,", s->status.vflip);
  p += snprintf(p, end - p, "\"dcw\":%u,", s->status.dcw);
  p += snprintf(p, end - p, "\"colorbar\":%u", s->status.colorbar);
#if defined(LED_GPIO_NUM)
  p += snprintf(p, end - p, ",\"led_intensity\":%u", led_duty);
#else
  p += snprintf(p, end - p, ",\"led_intensity\":%d", -1);
#endif
  *p++ = '}';
  *p++ = 0;
  httpd_resp_set_type(req, "application/json");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, json_response, strlen(json_response));
}

static esp_err_t xclk_handler(httpd_req_t *req) {
  char *buf = NULL;
  char _xclk[32];

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }
  if (httpd_query_key_value(buf, "xclk", _xclk, sizeof(_xclk)) != ESP_OK) {
    free(buf);
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }
  free(buf);

  int xclk = atoi(_xclk);
  log_i("Set XCLK: %d MHz", xclk);

  sensor_t *s = esp_camera_sensor_get();
  int res = s->set_xclk(s, LEDC_TIMER_0, xclk);
  if (res) {
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

static esp_err_t reg_handler(httpd_req_t *req) {
  char *buf = NULL;
  char _reg[32];
  char _mask[32];
  char _val[32];

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }
  if (httpd_query_key_value(buf, "reg", _reg, sizeof(_reg)) != ESP_OK || httpd_query_key_value(buf, "mask", _mask, sizeof(_mask)) != ESP_OK
      || httpd_query_key_value(buf, "val", _val, sizeof(_val)) != ESP_OK) {
    free(buf);
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }
  free(buf);

  int reg = atoi(_reg);
  int mask = atoi(_mask);
  int val = atoi(_val);
  log_i("Set Register: reg: 0x%02x, mask: 0x%02x, value: 0x%02x", reg, mask, val);

  sensor_t *s = esp_camera_sensor_get();
  int res = s->set_reg(s, reg, mask, val);
  if (res) {
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

static esp_err_t greg_handler(httpd_req_t *req) {
  char *buf = NULL;
  char _reg[32];
  char _mask[32];

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }
  if (httpd_query_key_value(buf, "reg", _reg, sizeof(_reg)) != ESP_OK || httpd_query_key_value(buf, "mask", _mask, sizeof(_mask)) != ESP_OK) {
    free(buf);
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }
  free(buf);

  int reg = atoi(_reg);
  int mask = atoi(_mask);
  sensor_t *s = esp_camera_sensor_get();
  int res = s->get_reg(s, reg, mask);
  if (res < 0) {
    return httpd_resp_send_500(req);
  }
  log_i("Get Register: reg: 0x%02x, mask: 0x%02x, value: 0x%02x", reg, mask, res);

  char buffer[20];
  const char *val = itoa(res, buffer, 10);
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, val, strlen(val));
}

static int parse_get_var(char *buf, const char *key, int def) {
  char _int[16];
  if (httpd_query_key_value(buf, key, _int, sizeof(_int)) != ESP_OK) {
    return def;
  }
  return atoi(_int);
}

static esp_err_t pll_handler(httpd_req_t *req) {
  char *buf = NULL;

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }

  int bypass = parse_get_var(buf, "bypass", 0);
  int mul = parse_get_var(buf, "mul", 0);
  int sys = parse_get_var(buf, "sys", 0);
  int root = parse_get_var(buf, "root", 0);
  int pre = parse_get_var(buf, "pre", 0);
  int seld5 = parse_get_var(buf, "seld5", 0);
  int pclken = parse_get_var(buf, "pclken", 0);
  int pclk = parse_get_var(buf, "pclk", 0);
  free(buf);

  log_i("Set Pll: bypass: %d, mul: %d, sys: %d, root: %d, pre: %d, seld5: %d, pclken: %d, pclk: %d", bypass, mul, sys, root, pre, seld5, pclken, pclk);
  sensor_t *s = esp_camera_sensor_get();
  int res = s->set_pll(s, bypass, mul, sys, root, pre, seld5, pclken, pclk);
  if (res) {
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

static esp_err_t win_handler(httpd_req_t *req) {
  char *buf = NULL;

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }

  int startX = parse_get_var(buf, "sx", 0);
  int startY = parse_get_var(buf, "sy", 0);
  int endX = parse_get_var(buf, "ex", 0);
  int endY = parse_get_var(buf, "ey", 0);
  int offsetX = parse_get_var(buf, "offx", 0);
  int offsetY = parse_get_var(buf, "offy", 0);
  int totalX = parse_get_var(buf, "tx", 0);
  int totalY = parse_get_var(buf, "ty", 0);  // codespell:ignore totaly
  int outputX = parse_get_var(buf, "ox", 0);
  int outputY = parse_get_var(buf, "oy", 0);
  bool scale = parse_get_var(buf, "scale", 0) == 1;
  bool binning = parse_get_var(buf, "binning", 0) == 1;
  free(buf);

  log_i(
    "Set Window: Start: %d %d, End: %d %d, Offset: %d %d, Total: %d %d, Output: %d %d, Scale: %u, Binning: %u", startX, startY, endX, endY, offsetX, offsetY,
    totalX, totalY, outputX, outputY, scale, binning  // codespell:ignore totaly
  );
  sensor_t *s = esp_camera_sensor_get();
  int res = s->set_res_raw(s, startX, startY, endX, endY, offsetX, offsetY, totalX, totalY, outputX, outputY, scale, binning);  // codespell:ignore totaly
  if (res) {
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  httpd_resp_set_hdr(req, "Content-Encoding", "gzip");
  sensor_t *s = esp_camera_sensor_get();
  if (s != NULL) {
    if (s->id.PID == OV3660_PID) {
      return httpd_resp_send(req, (const char *)index_ov3660_html_gz, index_ov3660_html_gz_len);
    } else if (s->id.PID == OV5640_PID) {
      return httpd_resp_send(req, (const char *)index_ov5640_html_gz, index_ov5640_html_gz_len);
    } else {
      return httpd_resp_send(req, (const char *)index_ov2640_html_gz, index_ov2640_html_gz_len);
    }
  } else {
    log_e("Camera sensor not found");
    return httpd_resp_send_500(req);
  }
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.max_uri_handlers = 16;

  httpd_uri_t index_uri = {
    .uri = "/",
    .method = HTTP_GET,
    .handler = index_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t status_uri = {
    .uri = "/status",
    .method = HTTP_GET,
    .handler = status_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t cmd_uri = {
    .uri = "/control",
    .method = HTTP_GET,
    .handler = cmd_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t capture_uri = {
    .uri = "/capture",
    .method = HTTP_GET,
    .handler = capture_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t bmp_uri = {
    .uri = "/bmp",
    .method = HTTP_GET,
    .handler = bmp_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t xclk_uri = {
    .uri = "/xclk",
    .method = HTTP_GET,
    .handler = xclk_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t reg_uri = {
    .uri = "/reg",
    .method = HTTP_GET,
    .handler = reg_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t greg_uri = {
    .uri = "/greg",
    .method = HTTP_GET,
    .handler = greg_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t pll_uri = {
    .uri = "/pll",
    .method = HTTP_GET,
    .handler = pll_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  httpd_uri_t win_uri = {
    .uri = "/resolution",
    .method = HTTP_GET,
    .handler = win_handler,
    .user_ctx = NULL
#ifdef CONFIG_HTTPD_WS_SUPPORT
    ,
    .is_websocket = true,
    .handle_ws_control_frames = false,
    .supported_subprotocol = NULL
#endif
  };

  ra_filter_init(&ra_filter, 20);

  log_i("Starting web server on port: '%u'", config.server_port);
  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &cmd_uri);
    httpd_register_uri_handler(camera_httpd, &status_uri);
    httpd_register_uri_handler(camera_httpd, &capture_uri);
    httpd_register_uri_handler(camera_httpd, &bmp_uri);

    httpd_register_uri_handler(camera_httpd, &xclk_uri);
    httpd_register_uri_handler(camera_httpd, &reg_uri);
    httpd_register_uri_handler(camera_httpd, &greg_uri);
    httpd_register_uri_handler(camera_httpd, &pll_uri);
    httpd_register_uri_handler(camera_httpd, &win_uri);
  }

  config.server_port += 1;
  config.ctrl_port += 1;
  log_i("Starting stream server on port: '%u'", config.server_port);
  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

void setupLedFlash() {
#if defined(LED_GPIO_NUM)
  ledcAttach(LED_GPIO_NUM, 5000, 8);
#else
  log_i("LED flash is disabled -> LED_GPIO_NUM undefined");
#endif
}
