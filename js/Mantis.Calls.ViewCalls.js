/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: js/Mantis.Calls.ViewCalls.js
 ** 
 ** Description: The 'view calls' section of the system
 *******************************************************************************
 ******************************************************************************/

Mantis.Calls.ViewCalls = function () {
    // view calls grid
    var gridStore;
    var grid;
    var pager;
    
    // call detail panel
    var callDetailPanel;
    var callInfoPanel;
    var callCommentPanel;
    
    // the call update panel and form
    var updateOptionsRadioGroup;
    var updateStatusRadio;
    var escalateCallRadio;
    var priorityCombo;
    var userCombo;
    var justCommentRadio;
    var commentText;
    var callUpdatePanel;
    var updateButton;
    var clearButton;
    
    // main panel
    var panel;
    
    return {
        /** Shows the panel */
        show: function () {
            if (this.panel === undefined) {
                // build the store
                this.gridStore = new Ext.data.Store({
                    url: APP_ROOT+"/api.php?f=getCalls", 
                    reader: new Ext.data.JsonReader ({
                        root: "calls", 
                        id: "id",
                        totalProperty: 'total'
                    }, [
                        {name: "id", mapping: "id"}, 
                        {name: "taker", mapping: "taker"}, 
                        {name: "date", mapping: "date", type: 'date', dateFormat:'Y-m-d H:i:s'}, 
                        {name: "caller", mapping: "caller"}, 
                        {name: "company", mapping: "company"}, 
                        {name: "message", mapping: "message"}, 
                        {name: "users", mapping: "users"}, 
                        {name: "contact", mapping: "contact"}, 
                        {name: "priority", mapping: "priority"}, 
                        {name: "status", mapping: "status"}, 
                        {name: "action", mapping: "action"}, 
                        {name: "recipient", mapping: "recipient"}, 
                        {name: "comments", mapping: "comments"}
                    ]), 
                    baseParams: {
                        session: Mantis.User.getSession()
                    }
                });
                
                // the pager
                this.pager = new Ext.PagingToolbar({
                    store: this.gridStore,
                    pageSize:parseInt(Mantis.User.getVarDefault('callsperpage',30),10)
                });
                
                // get the filter parameters
                this.gridStore.on('beforeload',function () {
                    var filters = Mantis.Calls.SearchBar.getFilter();
                    
                    // rebuild the base parameters
                    var bp = {
                        session: Mantis.User.getSession()
                    }
                    
                    // add the new parameters
                    for (var i=0; i < filters.length; i++) {
                        bp[filters[i].name] = filters[i].value
                    }
                    
                    this.gridStore.baseParams = bp;
                }, this);
                
                var sm = new Ext.grid.CheckboxSelectionModel();
                
                // build the grid
                this.grid = new Ext.grid.GridPanel({
                    id:'Mantis.Calls.ViewCalls.grid',
                    region:'center',
                    cm: new Ext.grid.ColumnModel ([
                        sm,
                        {header: "At", dataIndex: "date", id: "date", width: 120, sortable: false, renderer: renderDate},
                        {header: "Caller", dataIndex: "caller", id: "caller", width: 120, sortable: false, renderer: renderGeneric},
                        {header: "From", dataIndex: "company", id: "company", width: 120, sortable: false, renderer: renderGeneric},
                        {header: "Message", dataIndex: "message", id: "message", width: 200, sortable: false, renderer:renderMessage},
                        {header: "Contact", dataIndex: "contact", id: "contact", width: 150, sortable: false, renderer: renderContact},
                        {header: "Priority", dataIndex: "priority", id: "priority", width: 80, sortable: false, renderer: renderPriority},
                        {header: "Action", dataIndex: "action", id: "action", width: 120, sortable: false, renderer: renderGeneric},
                        {header: "Mark as closed", id: "close", width: 100, renderer: renderClose}
                    ]),
                    sm:sm,
                    store:this.gridStore,
                    autoSizeColumns: false, 
                    autoExpandColumn: "message", 
                    autoExpandMin: 100, 
                    autoExpandMax: 5000,
                    bbar:this.pager
                });
                
                // show the call detail if a single row is selected
                this.grid.getSelectionModel().on('selectionchange', function (sm) {
                    if (sm.getCount() == 1) {
                        this.showCallDetail(sm.getSelected());
                    } else {
                        this.callDetailPanel.hide();
                        this.panel.doLayout();
                    }
                }, this);
                
                // Build the lower panel
                // build the call info panel
                this.callInfoPanel = new Ext.Panel({
                    id:'Mantis.Calls.ViewCalls.callInfoPanel',
                    width:250,
                    height:250,
                    autoScroll:true,
                    html:'&nbsp;',
                    bodyStyle:'padding:3px;'
                });
                
                // build the ability to pick the ocmment order
                this.commentOrder = new Ext.form.ComboBox ({
                    allowBlank:false,
                    editable:false,
                    store: new Ext.data.ArrayStore ({
                        fields:['type','filter'],
                        data: [
                            ['Oldest First','oldest'],
                            ['Newest First','newest']
                        ]
                    }),
                    displayField:'type',
                    valueField:'filter',
                    value:Mantis.User.getVarDefault('commentorder','newest'),
                    mode:'local',
                    triggerAction:'all',
                    width:100
                });
                
                // Refresh the comments if it's changed
                this.commentOrder.on('select', function () {
                    var rec = this.grid.getSelectionModel().getSelected();
                    this.showComments(rec.get('comments'));
                }, this);
                
                // build the comment panel
                this.callCommentPanel = new Ext.Panel ({
                    id:'Mantis.Calls.ViewCalls.callCommentPanel',
                    width:250,
                    height:250,
                    autoScroll:true,
                    layout:'vbox',
                    cls:'dynamic-panel-scroll-y',
                    bodyStyle:'padding:3px;border-left:2px solid #BBBBBB;',
                    items: [
                        {html:'<i>No comments</i>'}
                    ],
                    tbar:[
                        '->',
                        'View Comments:',
                        this.commentOrder
                    ]
                });
                
                // radio options ('new' or open call)
                this.closeCallRadio = new Ext.form.Radio({
                    boxLabel:'Close call',
                    checked:true,
                    name:'action'
                }); // when selected, closes the call
                this.escalateCallRadio = new Ext.form.Radio({
                    boxLabel:'Escalate call',
                    checked:false,
                    name:'action'
                }); // when selected adds a user to the call (if selected), and changes the priority
                this.justCommentRadio = new Ext.form.Radio({
                    boxLabel:'Just Comment',
                    checked:false,
                    name:'action'
                }); // when selected, dows nothing
                
                // re-open call checkbox
                this.reopenCallCheck = new Ext.form.Checkbox({
                    boxLabel:'Re-open call',
                    checked:false,
                    listeners: {
                        scope:this,
                        'check': function () {
                            if (this.reopenCallCheck.getValue()) {
                                this.commentText.enable();
                                this.addCallButton.enable();
                                this.clearFormButton.enable();
                            } else {
                                this.commentText.disable();
                                this.addCallButton.disable();
                                this.clearFormButton.disable();
                            }
                        }
                    }
                });
                
                // priority combo box
                this.priorityCombo = new Ext.form.ComboBox({
                    allowBlank:false,
                    required:false,
                    editable:false,
                    store: new Ext.data.ArrayStore ({
                        fields:['priority','view'],
                        data: [
                            ['critical','Critical'],
                            ['urgent','Urgent'],
                            ['moderate','Moderate'],
                            ['minor','Minor'],
                            ['negligible','Negligible']
                        ]
                    }),
                    displayField:'view',
                    valueField:'priority',
                    value:'moderate',
                    mode:'local',
                    triggerAction:'all',
                    width:120,
                    tpl:Mantis.Utils.priorityTemplate,
                    listeners:{
                        scope:this,
                        'select': function () { this.escalateCallRadio.setValue(true); }
                    }
                });
                
                // user store
                this.userStore = new Ext.data.Store({
                    url: APP_ROOT+"/api.php?f=getUsers", 
                    reader: new Ext.data.JsonReader ({
                        root: "users", 
                        id: "id"
                    }, [
                        {name: "id", mapping: "id"}, 
                        {name: "name", mapping: "name"}, 
                        {name: "status", mapping: "status"}, 
                        {name: "statustext", mapping: "statustext"}
                    ]), 
                    baseParams: {
                        session: Mantis.User.getSession()
                    },
                    disableCaching:true
                });
                
                // user combo box
                this.userCombo = new Ext.form.ComboBox({
                    store: this.userStore,
                    triggerAction: 'all',
                    required:false,
                    allowBlank:true,
                    editable:false,
                    valueField:'id',
                    displayField:'name',
                    tpl:Mantis.Utils.userTemplate,
                    mode:'remote',
                    enableKeyEvents: true,
                    emptyText:"Escalate to",
                    width:120,
                    listeners:{
                        scope:this,
                        'focus': function () { this.userStore.load(); }, // display the dropdown on focus,
                        'select': function () { this.escalateCallRadio.setValue(true); }
                    }
                });
                
                // comment text
                this.commentText = new Ext.form.TextArea({
                    width:200,
                    height:70,
                    emptyText:'Comment',
                    allowBlank:true,
                    required:false
                });
                
                // buttons
                this.addCallButton = new Ext.Button({
                    text:'Update Call',
                    scope:this,
                    handler: function() {
                        var rec = this.grid.getSelectionModel().getSelected();
                        
                        // get the updates
                        var updates = {};
                        // Check if the call is open or closed
                        if (rec.get('status')=='closed') {
                            // if the call is closed, check the 'open call' value
                            if (this.reopenCallCheck.getValue()) {
                                updates.status = 'new';
                                
                                // add the comment
                                var com = String(this.commentText.getValue()).trim();
                                if (com.length > 0) {
                                    updates.comment = com;
                                }
                            }
                        } else {
                            var com = String(this.commentText.getValue()).trim();
                            
                            // check if we're closing the call
                            if (this.closeCallRadio.getValue()) {
                                updates.status = 'closed';
                                
                                // add the comment (if there is one)
                                if (com.length > 0) {
                                    updates.comment = com;
                                }
                            // or escalating the call
                            } else if (this.escalateCallRadio.getValue()) {
                                if (this.priorityCombo.getValue()) {
                                    updates.priority = this.priorityCombo.getValue();
                                }
                                if (this.userCombo.getValue()) {
                                    updates.users = this.userCombo.getValue();
                                }
                                
                                // add the comment (if there is one)
                                if (com.length > 0) {
                                    updates.comment = com;
                                }
                            // or just commenting
                            } else {
                                // add the comment
                                if (com.length > 0) {
                                    updates.comment = com;
                                }
                            }
                        }
                        
                        Mantis.Calls.updateCall(rec.get('id'), updates);
                    }
                });
                
                // clear form button
                this.clearFormButton = new Ext.Button({
                    text:'Clear',
                    scope:this,
                    handler: function() {
                        // just reload this view
                        this.showCallDetail(this.grid.getSelectionModel().getSelected());
                    }
                });
                
                this.callUpdatePanel = new Ext.Panel ({
                    id:'Mantis.Calls.ViewCalls.callUpdatePanel',
                    width:250,
                    height:250,
                    layout:'form',
                    bodyStyle:'padding-left:8px;border-left:2px solid #BBBBBB;',
                    items: [
                        this.reopenCallCheck,
                        this.closeCallRadio,
                        this.escalateCallRadio,
                        this.priorityCombo,
                        this.userCombo,
                        this.justCommentRadio,
                        {html:'<hr />',width:180,bodyStyle:'padding-left:10px;'},
                        this.commentText,
                        {
                            layout:'hbox',
                            items: [
                                this.addCallButton,
                                {html:'&nbsp;'},
                                this.clearFormButton
                            ]
                        }
                    ],
                    defaults: {
                        hideLabel:true
                    }
                });
                
                // and the wrapper panel
                this.callDetailPanel = new Ext.Panel({
                    id:'Mantis.Calls.ViewCalls.callDetailPanel',
                    region:'south',
                    layout:'hbox',
                    items:[
                        this.callInfoPanel,
                        this.callCommentPanel,
                        this.callUpdatePanel
                    ],
                    height:250,
                    width:750
                });
                
                // build the panel
                this.panel = new Ext.Panel({
                    id:'Mantis.Calls.ViewCalls.panel',
                    layout:'border',
                    region:'center',
                    tbar:Mantis.Calls.SearchBar.getToolbar(),
                    items:[
                        this.grid,
                        this.callDetailPanel
                    ]
                });
                
                // and add the panel to the calls section
                Mantis.Calls.addPanel(this.panel);
                
                // set up the auto updater
                setTimeout('Mantis.Calls.checkUpdates()',15000);
            }
            
            // load the store
            this.gridStore.load({params:{start:0,limit:Mantis.User.getVarDefault('callsperpage',30)}});
            if (this.grid.getSelectionModel().hasSelection()) {
                this.grid.getSelectionModel().clearSelections();
            }
            this.callDetailPanel.hide();
        },
        /** Show the call detail panel
         * @param rec {Ext.data.Record} The call to use to populate the panel
         */
        showCallDetail: function(rec) {
            // show the panel
            this.callDetailPanel.show();
            this.panel.doLayout();
            
            // Build the call HTML
            var callInfoHTML = "";
            // time
            callInfoHTML += "<b>"+rec.get('date').format(Mantis.User.getVarDefault('dateformat','jS M, Y'))+"</b>"+" at "+"<b>"+rec.get('date').format(Mantis.User.getVarDefault('timeformat','g:ia'))+"</b>";
            // priority
            if (rec.get('status') == 'new') {
                callInfoHTML += ' - <span class="priority-'+rec.get('priority')+'">'+rec.get('priority')+'</span>';
            } else {
                callInfoHTML += ' - <span class="call-closed">Closed</span>';
            }
            
            // taker
            if (rec.get('taker').id == Mantis.User.user_id) {
                callInfoHTML += "<br />Call taken by you";
            } else {
                callInfoHTML += "<br />Call taken by "+rec.get('taker').name;
            }
            
            // caller name
            if (rec.get('caller').length) {
                callInfoHTML += "<br /><br />"+rec.get('caller');
            } else {
                callInfoHTML += "<br /><br />Someone"
            }
            
            // company name
            if (rec.get('company').length) {
                callInfoHTML += " from "+rec.get('company');
            }
            
            // recipients
            callInfoHTML += " called for";
            if (rec.get('users').length>1) {
                callInfoHTML += ":"
                // get the users
                var users = rec.get('users');
                
                for (var i = 0; i < users.length; i++) {
                    if (users[i].id == Mantis.User.user_id) {
                        callInfoHTML += "<br /> - <b>You</b>";
                    } else {
                        callInfoHTML += "<br /> - "+users[i].name;
                    }
                }
            } else {
                if (rec.get('users')[0].id == Mantis.User.user_id) {
                    callInfoHTML += " <b>You</b>";
                } else {
                    callInfoHTML += " "+rec.get('users')[0].name;
                }
            }
            
            // message
            if (rec.get('message').length) {
                callInfoHTML += "<br /><br /><b>Message:</b><br />"+String(rec.get('message')).split("\n").join("<br />");
            } else {
                callInfoHTML += "<br /><br /><b>No message was left.</b>";
            }
            
            callInfoHTML += "<hr />";
            
            // contact details
            if (rec.get('contact').length>1) {
                callInfoHTML += "Contact them via:";
                
                var contact = rec.get('contact');
                for (var i = 0; i < contact.length; i++) {
                    callInfoHTML += "<br /> - "+contact[i];
                }
            } else if (rec.get('contact').length == 1) {
                callInfoHTML += "Contact them via <b>"+rec.get('contact')[0]+"</b>";
            } else {
                callInfoHTML += "<b>No contact details were left.</b>";
            }
            
            // action
            if (rec.get('action').length) {
                callInfoHTML += "<br /><br />Action required: <b>"+rec.get('action')+"</b>";
            }
            
            this.callInfoPanel.update(callInfoHTML);
            
            // now the call comments panel
            var comments = rec.get('comments');
            this.showComments(comments);
            
            // set up the call update panel
            if (rec.get('status') == 'closed') {
                // hide some fields
                this.closeCallRadio.hide();
                this.escalateCallRadio.hide();
                this.priorityCombo.hide();
                this.userCombo.hide();
                this.justCommentRadio.hide();
                // show the 're-open call' field
                this.reopenCallCheck.show();
                this.reopenCallCheck.setValue(false);
                // disable the comment text
                this.commentText.setValue('');
                this.commentText.disable();
                // disable the buttons
                this.addCallButton.disable();
                this.clearFormButton.disable();
                
                // layout the panel
                this.callUpdatePanel.doLayout();
            } else {
                // hide the 're-open call' field
                this.reopenCallCheck.hide();
                // show the fields for open calls
                this.closeCallRadio.show();
                this.closeCallRadio.setValue(true);
                this.escalateCallRadio.show();
                this.priorityCombo.show();
                this.userCombo.show();
                this.justCommentRadio.show();
                // enable the comment text
                this.commentText.setValue('');
                this.commentText.enable();
                // enable the escalate fields
                this.priorityCombo.enable();
                this.userCombo.enable();
                this.userCombo.reset();
                // set the priority field
                this.priorityCombo.setValue(rec.get('priority'));
                // enable the buttons
                this.addCallButton.enable();
                this.clearFormButton.enable();
                
                // layout the panel
                this.callUpdatePanel.doLayout();
            }
        },
        showComments: function (comments) {
            // clear previous comments
            this.callCommentPanel.removeAll(true);
            
            // Check if we have any comments
            if (comments.length) {
                // check if we're ordering oldest first or newest first (newest is default)
                if (this.commentOrder.getValue() == 'oldest') {
                    var i = 0; // the counter
                    var l = comments.length; // the length of the comments array
                    var m = 1; // the direction to move
                } else {
                    var i = comments.length - 1; // the counter as the length of the comments array
                    var l = -1; // the target
                    var m = -1;
                }
                
                var first = true;
                
                // display each of the comments
                for (i; i != l; i+=m) {
                    var comment = comments[i];
                    
                    // build the comment HTML - cheat using a table
                    var commentHTML = '<table style="width:230px">';
                    // build a date object
                    var date = Date.parseDate(comment.date,'Y-m-d H:i:s');
                    var today = new Date();
                    // and show the date
                    commentHTML += '<tr><td style="vertical-align:top;text-align:left;"><b>'+date.format(Mantis.User.getVarDefault('timeformat','g:ia'))+'</b></td>';
                    
                    // get the day
                    var day = '';
                    if (date.getDayOfYear() == today.getDayOfYear()) { // check if the call was taken today
                        day = 'Today';
                    } else if (date.getDayOfYear() == (today.getDayOfYear()-1) || // check if the call was taken yesterday
                               (today.getDayOfYear() == 0 && (date.format('m-d') == '12-31' && // check if we're on the border of a year
                                                             (parseInt(date.format('Y'))==(parseInt(today.format('Y'))-1))))) { // and that the years are consecutive
                        day = 'Yesterday';
                    } else {
                        // just show the date
                        day = date.format(Mantis.User.getVarDefault('dateformat','jS M, Y'));
                    }
                    // add the day to the HTML
                    commentHTML += '<td style="vertical-align:top;text-align:right;">'+day+'</td><tr/>';
                    
                    // add the action
                    commentHTML += '<tr><td colspan="2"><b>'+comment.action+'</b> by <b>'+(comment.user_id == Mantis.User.user_id?'You':comment.commenter)+'</b></td></tr>';
                    
                    // and add the comment (if there is one)
                    if (comment.comment.length) {
                        commentHTML += '<tr><td colspan="2">'+comment.comment.split("\n").join("<br />")+'</td></tr>';
                    }
                    
                    // and close the table.
                    commentHTML += '</table>';
                    
                    // and the style
                    var bstyle = 'padding-top:3px;padding-bottom:3px;';
                    // add a separator
                    if (first) {
                        first = false;
                    } else {
                        bstyle += 'border-top:1px dashed #DDDDDD;';
                    }
                    
                    this.callCommentPanel.add(new Ext.Panel({html:commentHTML,bodyStyle:bstyle,width:245}));
                }
            } else {
                // no comments
                this.callCommentPanel.add({html:'<i>No comments</i>'});
            }
            
            // make sure the panel is displayed properly
            this.callCommentPanel.doLayout();
        }
    };
    
    function renderDate(val, meta, rec, row, col, store) {
        var value = '';
        
        // check that we have a date object
        if (typeof(val)=='object') {
            var today = new Date();
            
            if (val.getDayOfYear() == today.getDayOfYear()) { // check if the call was taken today
                value = val.format(Mantis.User.getVarDefault('timeformat','g:ia'));
            } else if (val.getDayOfYear() == (today.getDayOfYear()-1) || // check if the call was taken yesterday
                       (today.getDayOfYear() == 0 && (val.format('m-d') == '12-31' && // check if we're on the border of a year
                                                     (parseInt(val.format('Y'))==(parseInt(today.format('Y'))-1))))) { // and that the years are consecutive
                value = val.format(Mantis.User.getVarDefault('timeformat','g:ia'))+' Yesterday';
            } else {
                // just show the date
                value = ' ' + val.format(Mantis.User.getVarDefault('dateformat','jS M, Y'));
            }
            
            meta.attr = 'ext:qtip="'+val.format(Mantis.User.getVarDefault('dateformat','jS M, Y'))+' at '+val.format(Mantis.User.getVarDefault('timeformat','g:ia'))+'"';
        } else {
            value = val;
        }
        
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        // and return our formatted value
        return value;
    }
    
    function renderContact(val, meta, rec, row, col, store) {
        var value = '';
        
        // check that we have a date object
        if (typeof(val)=='object') {
            var title = '';
            
            // build the qtip
            for (var i = 0; i < val.length; i++) {
                if (i != 0) {
                    title += "<br />";
                }
                title += val[i];
            }
            //  ensure that no HTML is rendered
            title = title.split("&").join("&amp;");
            meta.attr = 'ext:qtip="'+title+'"';
        }
        value = val;
        
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        // and return our formatted value
        return value;
    }
    
    function renderMessage(val, meta, rec, row, col, store) {
        var value = '';
        var title = '';
        // split out the title
        title = val.split("\n").join("<br />");
        // ensure that no HTML is rendered
        title = title.split("&").join("&amp;");
        
        // check that we have a date object
        if (title.length > 0) {
            meta.attr = 'ext:qtip="'+title+'"';
        }
        // get the value
        value = val;
        
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        // and return our formatted value
        return value;
    }
    
    function renderPriority(val, meta, rec, row, col, store) {
        var value = '';
        
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        // add the class
        value = '<span class="priority-'+val+'">'+val+'</span>';
        
        return value;
    }
    
    function renderClose(val, meta, rec, row, col, store) {
        var value = '';
        
        if (rec.get('status')=='new') {
            value = '<a href="#" onclick="Mantis.Calls.updateCall('+rec.get('id')+',{status:\'closed\'})">Close call</a>';
        } else {
            value = 'Call closed';
        }
        
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        // and return our formatted value
        return value;
    }
    
    function renderGeneric(val, meta, rec, row, col, store) {
        // set the CSS class
        meta.css = 'call-'+rec.get('status');
        
        return val;
    }
} ();