import KVMDBliSwitchV1 from './kvmd_switch_v1.js';
import KVMDBliSwitchV2 from './kvmd_switch_v2.js';
import Logger from '../../../log/logger.js';
import { BliKVMSwitchV1ModuleName, BliKVMSwitchV2ModuleName } from '../../../common/constants.js';
import { CONFIG_PATH, UTF8 } from '../../../common/constants.js';
import fs from 'fs';

const logger = new Logger();

class KVMSwitchFactory {

  static _instance = null;


  static getSwitchHandle(type) {
    if( this._instance !== null){
      if( type === this._instance.getChannel() ){
        return this._instance;
      }else{
        this._instance.disableSwitch();
      }
    }
    
    switch (type) {
      case BliKVMSwitchV1ModuleName:
        this._instance = new KVMDBliSwitchV1();
        break;
      case BliKVMSwitchV2ModuleName:
        this._instance = new KVMDBliSwitchV2();
        break;
      default:
        logger.error(`Unknown switch type: ${type}`);
        return null;
    }

    return this._instance;
  }

  static getSwitchList(){
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const switchList = kvmd.switch.list;
    return switchList;
  }

  static setSwitchModle(module){
    const config  = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    switch (module) {
      case BliKVMSwitchV1ModuleName:
        config.kvmd.switch.module = BliKVMSwitchV1ModuleName;
        break;
      case BliKVMSwitchV2ModuleName:
        config.kvmd.switch.module = BliKVMSwitchV2ModuleName;
        break;
      default:
        logger.error(`Unknown switch modle: ${module}`);
        return false;
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
    return true;
  }
}

export default KVMSwitchFactory;
