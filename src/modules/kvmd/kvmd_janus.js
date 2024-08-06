
/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/
import fs from 'fs';
import ModuleApp from '../module_app.js';

class Janus extends ModuleApp {
  static _instance = null;

  constructor() {
    if (!Janus._instance) {
      super();
      Janus._instance = this;
      this._init();
    }

    return Janus._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._bin = kvmd.janusBin;
    this._name = 'janus';
  }
}

export default Janus;
