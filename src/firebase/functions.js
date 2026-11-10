import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase.js'

const functions = getFunctions(app)

export const createConductorAccount = httpsCallable(functions, 'createConductorAccount')
export const updateConductorAccount = httpsCallable(functions, 'updateConductorAccount')
export const setConductorAccountStatus = httpsCallable(functions, 'setConductorAccountStatus')
export const resetConductorPassword = httpsCallable(functions, 'resetConductorPassword')
