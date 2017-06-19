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

const debug = require('debug')('node-mpd-ui:Routes/MPD');
const config = require('../base/config');

var express = require('express');
var router = express.Router();

const ResponseUtil = require('../base/response_utils');
const mpd = require('../base/mpd_utils');

// GET Connected Status
router.get('/', function(req, res, next) {
    ResponseUtil.sendData(res, {
        connected: mpd.isConnected()
    });
});

// GET Current Song
router.get('/status', function(req, res, next) {
    ResponseUtil.sendData(res, mpd.getCachedStatus());

    // Code disabled to reduce strain
    //mpd.getCurrentStatus(function(err, resp, msg) {
    //    if (err) {
    //        ResponseUtil.sendError(
    //            res,
    //            'Error while trying to receive current status.',
    //            { mpdError: err, message: msg }
    //        );
    //    } else {
    //        ResponseUtil.sendData(res, resp);
    //    }
    //});
});

// POST Control Basic Playback
router.post('/control/:action', function(req, res, next) {
    switch (req.params.action) {
        case 'playPause':
        case 'skip':
        case 'prev':
            mpd.controlPlayback(req.params.action, function(err, msg) {
                if (err) {
                    debug('ERROR while trying to control playback using %s', req.params.action);
                    ResponseUtil.sendError(res, 'FAILED to control playback', err);
                } else {
                    ResponseUtil.sendEmptyResponse(res);
                }
            });
            break;
        default:
            ResponseUtil.sendError(res, 'Unknown Action', req.params.action);
            break;
    }
});

// GET Queue
router.get('/queue', function(req, res, next) {
    mpd.getQueue(function(err, queue, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get Queue', err);
        } else {
            ResponseUtil.sendData(res, queue);
        }
    });
});

module.exports = router;
