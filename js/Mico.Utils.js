/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: js/Mico.Utils.js
 ** 
 ** Description: Basic utilities/helpers
 **
 ** Copyright (c) 2012 Samuel Levy
 ** 
 ** Mico is free software: you can redistribute it and/or
 ** modify it under the terms of the GNU Lesser General Public License as
 ** published by the Free Software Foundation, either version 3 of the License,
 ** or (at your option) any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 ** for more details.
 **
 ** You should have received a copy of the GNU Lesser General Public License
 *******************************************************************************
 ******************************************************************************/
Ext.namespace('Mico.Utils');

Mico.Utils = function () {
    return {
        /** Tests the strength of a password, and returns it as an integer out
         *   of 50. In general, the following weights can be used:
         *    0: Empty/blank password
         *    1-10: Weak password
         *    11-25: Medium strength password
         *    26-35: Strong password
         *    36-50: Very strong password
         * @param pass {string} The password to check
         * @returns {int} The strength rating of the password
         */
        passwordStrength: function (pass) {
            // break the strength test up into a number of simple regexes with points
            var tests = [
                // length
                {reg:/^(.{3,})$/, points: 1}, // minimum 3 characters
                {reg:/^(.{6,})$/, points: 2}, // minimum 6 characters (note: this will match both 3 and 6, giving 3 points)
                {reg:/^(.{9,})$/, points: 3}, // minimum 9 characters (note: this will match 3, 6, and 9 giving 6 points)
                {reg:/^(.{12,})$/, points: 4}, // minimum 12 characters (note: this will match 3, 6, 9 and 12 giving 10 points)
                // character mixes
                {reg:/^(.*[a-z].*)$/, points: 1}, // at least 1 lower-case letter
                {reg:/^(.*[A-Z].*)$/, points: 2}, // at least 1 upper-case letter
                {reg:/^(.*[0-9].*)$/, points: 3}, // at least 1 number
                {reg:/^(.*[^a-zA-Z0-9].*)$/, points: 4}, // at least 1 non alpha-numeric character
                {reg:/^(.*([A-Z].*){3,}.*)$/, points: 5}, // at least 3 upper-case letters
                {reg:/^(.*([0-9].*){3,}.*)$/, points: 5}, // at least 3 numbers
                {reg:/^(.*([^a-zA-Z0-9].*){3,}.*)$/, points: 6}, // at least 3 non alpha-numeric characters
                {reg:/^(.*([0-9]+[^0-9]+[0-9])+.*)$/, points: 6}, // at least 2 non-consecutive numbers
                {reg:/^(.*([^a-zA-Z0-9]+[a-zA-Z0-9]+[^a-zA-Z0-9])+.*)$/, points: 8} // at least 2 non-consecutive non alpha-numeric characters
            ]
            
            var points = 0;
            
            // run the tests
            for (var i = 0; i < tests.length; i++) {
                if (pass.match(tests[i].reg)) {
                    points += tests[i].points;
                }
            }
            
            // point come to a total out of 50
            return points;
        },
        /** Simple function to convert an array into a serialized string for
         *   passing to php. It doesn't really handle nested types gracefully
         * @param arr {Array} The array to convert
         * @returns {string} A textual representation of the array
         */
        serialiseArray: function (arr) {
            var text = '';
            var total = 0;
            for (var k in arr) {
                // Remove some extra function keys that ExtJS adds to the array
                if (String(k) != "remove" && String(k) != "indexOf") {
                    // add the item
                    text = text + 's:' + String(k).length + ':"' + String(k) + '";s:' + String(arr[k]).length + ':"' + String(arr[k]) + '";';
                    // and incremement the total number of items
                    total ++;
                }
            }
            // and wrap it like an array
            text = 'a:' + total + ':{' + text + '}';
            return text;
        },
        /** Returns the template for 'caller' fields
         * @param displayField {string} The field to display
         */
        callerTemplate: function (displayField) {
            return '<tpl for="."><div class="x-combo-list-item caller-match-{match}">{'+displayField+'}</div></tpl>';
        },
        /** Returns the template for 'user' fields */
        userTemplate: function () {
            return '<tpl for="."><div class="x-combo-list-item"><img class="user-status-icon" title="{statustext}" src="'+APP_ROOT+'/skin/static/status/{status}.png" />{name}</div></tpl>';
        },
        /** Returns the template for 'priority' fields */
        priorityTemplate: function () {
            return '<tpl for="."><div class="x-combo-list-item priority-{priority}">{view}</div></tpl>';
        },
        /** Returns the template for time/date fields */
        timedateTemplate: function () {
            return '<tpl for="."><div class="x-combo-list-item">{display} e.g: {example}</div></tpl>';
        }
    };
} ();