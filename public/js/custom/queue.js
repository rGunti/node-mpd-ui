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

function calculateTableScrollHeight() {
    // Calculate Table Height
    var screenHeight = $(window).height();
    var navHeight = 100;
    var searchBoxHeight = $('#searchBoxTarget').parent().height();
    var footerHeight = $('footer').height();
    var bottomTableRowHeight = 71;
    var topTableRowHeight = 38;
    var failSafe = 30;

    var tableScrollHeight = screenHeight
        - navHeight
        - searchBoxHeight
        - footerHeight
        - bottomTableRowHeight
        - topTableRowHeight
        - failSafe
    ;
    return tableScrollHeight;
}

$(document).ready(function() {
    var queueTable = $('#queueTable').DataTable({
        ajax: "/mpd/queue",
        columns: [
            { responsivePriority: 1, data: "Pos", render: function(d,t,r,m) {
                return (Number(d) + 1); // Display Natural Index instead of Zero-based
            } },
            { responsivePriority: 1, data: "Title", defaultContent: "<i>No title</i>" },
            { responsivePriority: 2, data: "Artist", defaultContent: "-" },
            { responsivePriority: 3, data: "Album", defaultContent: "-" },
            { responsivePriority: 4, data: "Time", render: function(d,t,r,m) {
                return autoFormatTime(d);
            } },
            { responsivePriority: 5, data: null, sortable: false,
                defaultContent: '<button class="btn btn-primary btn-xs action-queue-play-at-pos">' +
                '<i class="material-icons">play_arrow</i> Play' +
                '</button>' +
                '<button class="btn btn-primary btn-xs action-queue-move-to-top">' +
                '<i class="material-icons">arrow_drop_up</i> Move to Top' +
                '</button>' +
                '<button class="btn btn-primary btn-xs action-queue-play-next">' +
                '<i class="material-icons">play_circle_outline</i> Play Next' +
                '</button>'
            }
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
        scrollCollapse: true,
        scrollY: calculateTableScrollHeight(),
        initComplete: function(settings, json) {
            // Move Text Box out to Destination
            var searchBox = $('.dataTables_filter input[type=search]').each(function() {
                $('#searchBoxTarget').append(this);
            });

            console.log('Init Completed');
        }
    });

    console.log(queueTable.settings());

    $(window).resize(function() {
        if (!queueTable) return;
        queueTable.settings();
    });

    function generateSongInfoText(song) {
        return '<b>' + song.Title + '</b>' + (song.Artist ? ' by <b>' + song.Artist + '</b>' : '')
    }

    $('#queueTable tbody').on('click', 'button', function(e) {
        var source = e.currentTarget;
        var rowIndex = $(this).parents('tr');

        // If Table is collapsed (responsive), we need to take an extra step
        if (rowIndex.hasClass('child')) rowIndex = rowIndex.prev();

        var row = queueTable.row(rowIndex).data();

        if (!row) {
            console.error('Cannot execute action, no data has been found!');
            return;
        } else if (!source) {
            console.error('Unknown Source!');
            return;
        } else {
            source = $(source);
            if (source.hasClass('action-queue-play-at-pos')) {
                console.log('Play at Pos %s', row.Pos);
                sendSimpleAjaxRequest('/mpd/queue/' + row.Pos + '/play', 'post', null, function(r) {
                    $.toaster({
                        title: 'Now Playing',
                        message: generateSongInfoText(row)
                    });
                });
            } else if (source.hasClass('action-queue-move-to-top')) {
                console.log('Move to top from Pos %s', row.Pos);
                sendSimpleAjaxRequest('/mpd/queue/' + row.Pos + '/move/0', 'post', null, function (r) {
                    queueTable.ajax.reload();
                    $.toaster({
                        title: 'Success',
                        message: 'Moved ' + generateSongInfoText(row) +
                        ' from #<b>' + (Number(r.data.source) + 1) + '</b>' +
                        ' to the <b>first</b> position.'
                    });
                });
            } else if (source.hasClass('action-queue-play-next')) {
                console.log('Move Pos %s after current song', row.Pos);
                sendSimpleAjaxRequest('/mpd/queue/' + row.Pos + '/move/NOW_PLAYING+1', 'post', null, function(r) {
                    console.log(r);
                    queueTable.ajax.reload(false);
                    queueTable.page.jumpToData(r.data.target, 0);
                    $.toaster({
                        title: 'Success',
                        message: 'Moved ' + generateSongInfoText(row) +
                        ' from #<b>' + (Number(r.data.source) + 1) + '</b>' +
                        ' to #<b>' + (Number(r.data.target) + 1) + '</b>'
                    });
                });
            } else {
                console.error('Unknown Action for Button', source);
            }
        }
    });
});
