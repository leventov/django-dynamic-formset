/**
 * fork of jQuery Formset 1.2,
 * which makes user (of the plugin) to be in charge of appearance of add/delete buttons
 * @author Stanislaus Madueke, Roma Leventov
 * @requires jQuery 1.6 or later
 *
 * Copyright (c) 2009, Stanislaus Madueke
 * All rights reserved.
 *
 * Licensed under the New BSD License
 * See: http://www.opensource.org/licenses/bsd-license.php
 */
;
(function ($) {
    $.fn.formset = function (opts) {
        var options = $.extend({}, $.fn.formset.defaults, opts),
            flatExtraClasses = options.extraClasses.join(' '),
            $$ = $(this),

            applyExtraClasses = function (row, ndx) {
                if (options.extraClasses) {
                    row.removeClass(flatExtraClasses);
                    row.addClass(options.extraClasses[ndx % options.extraClasses.length]);
                }
            },

            updateElementIndex = function (elem, prefix, ndx) {
                var idRegex = new RegExp('(' + prefix + '-\\d+-)|(^)'),
                    replacement = prefix + '-' + ndx + '-';
                if (elem.attr('for')) elem.attr('for', elem.attr('for').replace(idRegex, replacement));
                if (elem.attr('id')) elem.attr('id', elem.attr('id').replace(idRegex, replacement));
                if (elem.attr('name')) elem.attr('name', elem.attr('name').replace(idRegex, replacement));
            },

            hasChildElements = function (row) {
                return row.find(options.formElements).length > 0;
            },

            lastForm = function () {
                return $('.' + options.formCssClass + ':last');
            },


            tuneDeleteButton = function (row) {
                row.find(options.deleteButtons).click(function (event) {
                    if (event) event.preventDefault(); // real button
                    var row = $(this).parents('.' + options.formCssClass),
                        del = row.find('input:hidden[id $= "-DELETE"]');
                    if (del.length) {
                        // We're dealing with an inline formset; rather than remove
                        // this form from the DOM, we'll mark it as deleted and hide
                        // it, then let Django handle the deleting:
                        del.val('on');
                        row.hide();
                    } else {
                        row.remove();
                        // Update the TOTAL_FORMS form count.
                        // Also update names and IDs for all remaining form controls so they remain in sequence:
                        var forms = $('.' + options.formCssClass).not('.formset-custom-template');
                        $('#id_' + options.prefix + '-TOTAL_FORMS').val(forms.length);
                        for (var i = 0, formCount = forms.length; i < formCount; i++) {
                            applyExtraClasses(forms.eq(i), i);
                            forms.eq(i).find(options.indexedElements).each(function () {
                                updateElementIndex($(this), options.prefix, i);
                            });
                        }
                    }
                    // If a post-delete callback was provided, call it with the deleted form:
                    if (options.removed) options.removed(row);
                    return false;
                });
            },

            tuneRow = function (row) {
                var del = row.find('input[id $= "-DELETE"]');
                if (del.length) {
                    // If you specify "can_delete = True" when creating an inline formset,
                    // Django adds a checkbox to each form in the formset.
                    // Hide the default checkbox and the label:
                    del.prop('type', 'hidden');
                    del.add(row.find('label[for="' + del.attr('id') + '"]')).hide();
                    if (del.prop('checked'))
                        row.hide();
                }
                tuneDeleteButton(row);
                row.addClass(options.formCssClass);
            };

        $$.each(function (i) {
            var row = $(this);
            if (hasChildElements(row)) {
                tuneRow(row);
                applyExtraClasses(row, i);
            }
        });

        if ($$.length) {
            var addButton, template;
            if (options.formTemplate) {
                // If a form template was specified, we'll clone it to generate new form instances:
                template = (options.formTemplate instanceof $) ? options.formTemplate : $(options.formTemplate);
                tuneRow(template);
                template.removeAttr('id').addClass('formset-custom-template');
                template.find(options.indexedElements).each(function () {
                    updateElementIndex($(this), options.prefix, 2012);
                });
            } else {
                // Otherwise, use the last form in the formset; this works much better if you've got
                // extra (>= 1) forms (thnaks to justhamade for pointing this out):
                template = lastForm().clone(true).removeAttr('id');
                // For what?
                //template.find('input:hidden[id $= "-DELETE"]').remove();
                template.find(options.formElements).each(function () {
                    var elem = $(this);
                    // If this is a checkbox or radiobutton, uncheck it.
                    // This fixes Issue 1, reported by Wilson.Andrew.J:
                    if (elem.is('input:checkbox') || elem.is('input:radio')) {
                        elem.attr('checked', false);
                    } else {
                        elem.val('');
                    }
                });
            }
            // FIXME: Perhaps using $.data would be a better idea?
            options.formTemplate = template;

            addButton = $(options.addButton);
            addButton.click(function (event) {
                if (event) event.preventDefault(); // real button
                var formCount = parseInt($('#id_' + options.prefix + '-TOTAL_FORMS').val()),
                    row = options.formTemplate.clone(true).removeClass('formset-custom-template');
                applyExtraClasses(row, formCount);
                row.find(options.indexedElements).each(function () {
                    updateElementIndex($(this), options.prefix, formCount);
                });
                row.insertAfter(lastForm()).show();
                $('#id_' + options.prefix + '-TOTAL_FORMS').val(formCount + 1);
                // If a post-add callback was supplied, call it with the added form:
                if (options.added) options.added(row);
                return false;
            });
        }

        return $$;
    }

    /* Setup plugin defaults */
    $.fn.formset.defaults = {
        prefix:'form', // The form prefix for your django formset
        formTemplate:null, // The jQuery selection cloned to generate new form instances

        deleteButtons:'.delete-row', // jQuery selector specified delete buttons (links)
        addButton:'#add-row', // jQuery selector specified an add button (link)

        formElements:'input,select,textarea,label',
        indexedElements:'input,select,textarea,label',

        formCssClass:'dynamic-form', // CSS class applied to each form in a formset
        extraClasses:[], // Additional CSS classes, which will be applied to each form in turn
        added:null, // Function called each time a new form is added
        removed:null // Function called each time a form is deleted
    };
})(jQuery)

