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

const debug = require('debug')('mpd-ui:ResponseUtils');

var ResponseUtils = {
    respondWithJson: function(res, data) { res.json(data); },
    sendError: function(res, errorMessage, errorData) {
        ResponseUtils.respondWithJson(res, {
            ok: false,
            message: errorMessage,
            error: errorData
        });
    },
    sendNotImplementedError: function(res) {
        ResponseUtils.sendError(res, 'This method is NOT IMPLEMENTED!', "NOT_IMPLEMENTED");
    },
    sendData: function(res, data) {
        ResponseUtils.respondWithJson(res, {
            ok: true,
            data: data
        });
    },
    sendEmptyResponse: function(res, ok) {
        ResponseUtils.respondWithJson(res, {
            ok: ok || true
        });
    }
};

module.exports = ResponseUtils;
