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

$(document).ready(function() {
    $('#queueTable').DataTable({
        ajax: "/mpd/queue",
        columns: [
            { responsivePriority: 1, data: "Pos", render: function(d,t,r,m) {
                return (Number(d) + 1); // Display Natural Index instead of Zero-based
            } },
            { responsivePriority: 1, data: "Title" },
            { responsivePriority: 2, data: "Artist", defaultContent: "-" },
            { responsivePriority: 3, data: "Album", defaultContent: "-" },
            { responsivePriority: 4, data: "Time", render: function(d,t,r,m) {
                return autoFormatTime(d);
            } }
        ],
        lengthChange: false,
        responsive: true,
        language: {
            search: "",
            paginate: {
                previous: "<b>&laquo;</b> Back",
                next: "Next <b>&raquo;</b>"
            },
            info: "_START_ - _END_ / _TOTAL_ entries",
            infoFiltered: "(Total: _MAX_)"
        },
        pagingType: "simple",
        pageLength: 10,
        initComplete: function(settings, json) {
            // Move Text Box out to Destination
            var searchBox = $('.dataTables_filter input[type=search]').each(function() {
                $('#searchBoxTarget').append(this);
            });

            console.log('Init Completed');
        }
    });
});
