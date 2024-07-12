import dotenv from 'dotenv';
dotenv.config();

export const CONFIG_PATH = 'config/app.json';
export const UTF8 = 'utf8';
export const BliKVMSwitchV1ModuleName = "BliKVM_switch_v1";
export const BliKVMSwitchV2ModuleName = "BliKVM_switch_v2";
export const JWT_SECRET = process.env.JWT_SECRET || 'helloBliKVM';