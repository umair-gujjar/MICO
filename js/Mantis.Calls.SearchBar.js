/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: js/Sphodro.Calls.SearchBar.js
 ** 
 ** Description: Defines the 'calls' searchbar
 **
 ** Copyright (c) 2010 Samuel Levy
 ** 
 ** Sphodro is free software: you can redistribute it and/or
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
Sphodro.Calls.SearchBar = function () {
    var toolbar;
    var filterField;
    var orderFilter;
    var showClosedField;
    var refreshButton;
    
    return {
        /** Build the toolbar
         * @returns {Ext.Toolbar} A toolbar
         */
        getToolbar: function () {
            if (this.toolbar === undefined) {
                // the filter
                this.filterField = new Ext.form.ComboBox({
                    allowBlank:false,
                    editable:false,
                    store: new Ext.data.ArrayStore ({
                        fields:['type','filter'],
                        data: Sphodro.Utils.CommonStores.callsSearchFilter
                    }),
                    displayField:'type',
                    valueField:'filter',
                    value:Sphodro.User.getVarDefault('showcalls','assigned'),
                    mode:'local',
                    triggerAction:'all',
                    width:130
                });
                
                this.filterField.on('select', function () {
                    Sphodro.Calls.ViewCalls.gridStore.load({params:{start:0,limit:Sphodro.User.getVarDefault('callsperpage',30)}});
                }, this);
                
                // the order
                this.orderField = new Ext.form.ComboBox({
                    allowBlank:false,
                    editable:false,
                    store: new Ext.data.ArrayStore ({
                        fields:['type','filter'],
                        data: Sphodro.Utils.CommonStores.callsOrderFilter
                    }),
                    displayField:'type',
                    valueField:'filter',
                    value:Sphodro.User.getVarDefault('ordercalls','recent'),
                    mode:'local',
                    triggerAction:'all',
                    width:100
                });
                
                this.orderField.on('select', function () {
                    Sphodro.Calls.ViewCalls.gridStore.load({params:{start:0,limit:Sphodro.User.getVarDefault('callsperpage',30)}});
                }, this);
                
                // whether to show closed or not
                this.showClosedField = new Ext.form.Checkbox({
                    checked:false
                });
                this.showClosedField.setValue(Sphodro.User.getVar('showclosed'));
                
                this.showClosedField.on('check', function () {
                    Sphodro.Calls.ViewCalls.gridStore.load({params:{start:0,limit:Sphodro.User.getVarDefault('callsperpage',30)}});
                }, this);
                
                // and build the toolbar
                this.toolbar = new Ext.Toolbar ({
                    items: [
                        'Show: ',
                        this.filterField,
                        ' ordered by: ',
                        this.orderField,
                        '-',
                        ' Show closed? ',
                        this.showClosedField
                    ]
                });
            }
            
            return this.toolbar;
        },
        /** Get the filters
         * @returns {array} An array of filter objects with 'name' and 'value' as properties
         */
        getFilter: function () {
            var filter;
            
            if (this.toolbar == undefined) {
                filter = [
                    {name:'filter',value:Sphodro.User.getVarDefault('showcalls','assigned')},
                    {name:'order',value:Sphodro.User.getVarDefault('ordercalls','recent')},
                    {name:'closed',value:Sphodro.User.getVarDefault('showclosed',false)}
                ];
            } else {
                filter = [
                    {name:'filter',value:this.filterField.getValue()},
                    {name:'order',value:this.orderField.getValue()},
                    {name:'closed',value:this.showClosedField.getValue()}
                ];
            }
            
            return filter;
        }
    };
} ();