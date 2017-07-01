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
    $('#setOutputModal').on('shown.bs.modal', function() {
        console.log('Opening Output Modal...');
        $('#outputsRenderTarget').empty();

        $.ajax({
            url: '/mpd/outputs',
            beforeSend: function() {
                $('#actionLoadingIndicator').fadeIn();
            }
        }).done(function(d) {
            if (d.ok) {
                var outputs = d.data;
                for (var i = 0; i < d.data.length; i++) {
                    var output = d.data[i];
                    var item = $('#mpdOutputTemplate').clone();
                    item.removeAttr('id');
                    $('.output-name', item).text(output.outputname);
                    $('input[type=checkbox]', item)
                        .prop('checked', output.outputenabled == 1)
                        .data('id', output.outputid)
                        .change(outputCheckboxClick)
                    ;
                    item.click(outputCheckboxClick);
                    item.data('id', output.outputid);
                    item.removeClass('hidden');
                    item.appendTo('#outputsRenderTarget');
                }
            }
        }).always(function() {
            $('#actionLoadingIndicator').fadeOut();
        });
    });

    function outputCheckboxClick(e) {
        var checkbox = $(this);
        if (checkbox.is('input')) {
            var id = checkbox.data('id');
            var newValue = checkbox.prop('checked');

            console.log(id, newValue);

            $('#actionLoadingIndicator').fadeIn();
            sendSimpleAjaxRequest('/mpd/output/' + id, 'post', { state: (newValue == true) }, function(d) {
                $('#actionLoadingIndicator').fadeOut();
            });
        }
    }

    $('#changeOutputsButton').click(function() {
        $('#setOutputModal').modal('show');
    });
});
