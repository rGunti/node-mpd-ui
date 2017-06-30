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

const debug = require('debug')('mpd-ui:Routes/Index');
const config = require('../base/config');

var express = require('express');
var router = express.Router();

function respond(res, view, page, title, additionalIncludes, data) {
    res.render('templates/' + view, {
        title: title,
        page: page,
        config: config.items,
        additionalIncludes: additionalIncludes || [],
        data: data
    });
}

/* GET "Now Playing" */
router.get('/', function(req, res, next) {
    respond(res, 'main', 'home', 'Now Playing');
});

/* GET "Queue" */
router.get('/queue', function(req, res, next) {
    respond(res, 'main', 'queue', 'Queue', [
        'modals/queue_select'
    ]);
});

/* GET test_table page. */
router.get('/test_table', function(req, res, next) {
    respond(res, 'main', 'test_table', 'Test Table');
});

/* GET "Library Search" */
router.get('/library/search', function(req, res, next) {
    respond(res, 'main', 'lib_search', 'Search in Library', [
        'modals/lib_play'
    ]);
});

module.exports = router;
