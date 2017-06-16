/*********************************************************************************** *
 * MIT License
 *
 * Copyright (c) 2017 Raphael "rGunti" Guntersweiler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ********************************************************************************* */
const fs = require('fs');
const debug = require('debug')('mpd-ui:Config');

var config = {
    items: {},
    DEFAULT_CONFIG: 'config/config.json',
    KEYS: {
        TITLE: "title",
        FLAG: "flag",
        MPD_HOST: "MPD.host",
        MPD_PORT: "MPD.port"
    },
    init: function() {
        debug('Initializing Config ...');
        var configFilePath = process.env.CONFIG_PATH || config.DEFAULT_CONFIG;
        config.readFromFile(configFilePath);
    },
    readFromFile: function(filename) {
        debug('Reading Config File %s ...', filename);
        config.items = JSON.parse(fs.readFileSync(filename))
    },
    getValue: function(key) {
        debug('Getting Config Value %s', key);
        var splitKey = key.split('.');
        var value = null;
        for (var i = 0; i < splitKey.length; i++) {
            var keyItem = splitKey[i];
            if (i === 0) {
                value = config.items[keyItem];
            } else {
                value = value[keyItem]
            }
        }
        return value;
    }
};
config.init();
module.exports = config;
