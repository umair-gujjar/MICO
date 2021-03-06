/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: js/Mico.Calls.js
 ** 
 ** Description: The main 'calls' section of the system
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
Ext.namespace('Mico.Calls');

Mico.Calls = function () {
    // menu id
    var menuId;
    
    // main panel
    var panel;
    
    return {
        /** Adds the link to the menu */
        init: function () {
            if (this.menuId == undefined) {
                this.menuId = Mico.SystemMenu.addItem(Mico.Lang.Calls.menu_text, 'Mico.Calls.show()','system');
            }
        },
        /** Shows the panel */
        show: function () {
            if (this.panel == undefined) {
                // ensure that the menu item is initialised
                if (this.menuId == undefined) {
                    this.init();
                }
                
                // set up the panel
                this.panel = new Ext.Panel({
                    id:'Mico.Calls.panel',
                    layout:'border'
                });
                
                // Build the panels
                Mico.Calls.AddCall.show();
                Mico.Calls.ViewCalls.show();
                
                // Add to the main panel
                Mico.Application.addPanel(this.panel);
            }
            
            // mark this panel as selected
            Mico.SystemMenu.markSelected(this.menuId);
            Mico.Application.showPanel('Mico.Calls.panel');
        },
        /** Adds a panel to this panel
         * @param panel {Ext.Panel} The panel to add
         */
        addPanel: function (panel) {
            this.panel.add(panel);
        },
        /** Updates a call
         * @param id {int} The call ID to update
         * @param updates {object} The updates to make. Options are:
         *          status {string} new|closed
         *          priority {string} critical|urgent|moderate|minor|negligible
         *          users {int|array} A user ID to add to the call, or an array of user IDs
         *          comment {string} A comment for the update
         */
        updateCall: function (id,updates) {
            var conn = new Ext.data.Connection();
            
            // build the base paramaters object
            var params = {
                session: Mico.User.getSession(),
                id:id
            }
            
            // add the extra parameters (if they exist)
            if (updates.status !== undefined) { params.status = updates.status; }
            if (updates.priority !== undefined) { params.priority = updates.priority; }
            // users can be either an integer or an array
            if (updates.users !== undefined) { params.users = (typeof(updates.users)=='int'?updates.users:Mico.Utils.serialiseArray(updates.users)); }
            if (updates.comment !== undefined) { params.comment = updates.comment; }
            
            // make the call
            conn.request({
                url:APP_ROOT+'/api.php?f=updateCall',
                params: params,
                callback: function (options, success, response) {
                    var res = Ext.decode(response.responseText);
                    if (success && res.success) {
                        Mico.Calls.ViewCalls.gridStore.reload();
                    } else {
                        var msg = Mico.Lang.Common.unknownError_text;
                        if (res.info !== undefined) {
                            msg = res.info;
                        }
                        Ext.Msg.alert(Mico.Lang.Common.unknownError_title, msg);
                    }
                },
                scope: this
            });
        },
        /** Checks for updates affecting the active user */
        checkUpdates: function () {
            var conn = new Ext.data.Connection();
            
            conn.request({
                url:APP_ROOT+'/api.php?f=getLastUpdate',
                params: { session: Mico.User.getSession() },
                callback: function (options, success, response) {
                    var res = Ext.decode(response.responseText);
                    if (success && res.success) {
                        // check if there have been any updates
                        if (res.lastupdate != Mico.User.getVar('lastupdate')) {
                            // don't reload if we're viewing a call
                            if (Mico.Calls.ViewCalls.grid.getSelectionModel().getCount() !== 1) {
                                // reload the grid
                                Mico.Calls.ViewCalls.gridStore.reload();
                                
                                dirty = Mico.User.dirty;
                                // set the variable
                                Mico.User.setVar('lastupdate',res.lastupdate);
                                // commit the changes locally
                                Mico.User.commit(true);
                            } else {
                                // Get the options selected/text
                                var justcomment = Mico.Calls.ViewCalls.justCommentRadio.getValue();
                                var escalate = Mico.Calls.ViewCalls.escalateCallRadio.getValue();
                                var closecall = Mico.Calls.ViewCalls.closeCallRadio.getValue();
                                
                                var commenttext = Mico.Calls.ViewCalls.commentText.getValue();
                                
                                var user = Mico.Calls.ViewCalls.userCombo.getValue();
                                var priority = Mico.Calls.ViewCalls.priorityCombo.getValue();
                                
                                // block the user momentarily
                                Ext.Msg.wait(Mico.Lang.Calls.loadUpdates_title,Mico.Lang.Calls.loadUpdated_text);
                                
                                Mico.Calls.ViewCalls.gridStore.reload({
                                    callback:function() {
                                        // reset the values
                                        Mico.Calls.ViewCalls.justCommentRadio.setValue(justcomment);
                                        Mico.Calls.ViewCalls.escalateCallRadio.setValue(escalate);
                                        Mico.Calls.ViewCalls.closeCallRadio.setValue(closecall);
                                        Mico.Calls.ViewCalls.commentText.setValue(commenttext);
                                        Mico.Calls.ViewCalls.userCombo.setValue(user);
                                        Mico.Calls.ViewCalls.priorityCombo.setValue(priority);
                                        
                                        // hide the box
                                        Ext.Msg.hide();
                                    },
                                    scope: this
                                });
                                
                                dirty = Mico.User.dirty;
                                // set the variable
                                Mico.User.setVar('lastupdate',res.lastupdate);
                                // commit the changes locally
                                Mico.User.commit(true);
                            }
                        }
                    } else {
                        // if the user's session has expired, block access to the system, and refresh
                        if (res.sessionexpired) {
                            Ext.Msg.alert(Mico.Lang.Calls.sessionExpired_title,Mico.Lang.Calls.sessionExpired_text,function () {window.location=APP_ROOT;}, this);
                        }
                    }
                    
                    // if we're not logged out, check again
                    if (!res.sessionexpired) {
                        // set the timeout to check again in 15 seconds
                        this.updateTimeout = setTimeout('Mico.Calls.checkUpdates()',15000);
                    }
                },
                scope: this
            });
        }
    };
} ();