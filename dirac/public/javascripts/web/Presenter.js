var columnWidth = '.33'; // 3 Columns per page
var refreshRate = 0; // autorefresh is off
var refeshID = 0;
var layout = 'default';
var heartbeat = '';
var contextMenu = '';
var timeout = 60000; // the time out set to 60 second...
var plotData = null; // it stores the decoded URL.

Ext.ns('Presenter');

/*-------------------------------------------------------------------------------------------------------------*/
Presenter.GetRequest = function(opname, url, params, scope, success) {
  // The code copied from the ProductionStep.js
  var conn = new Ext.data.Connection();
  conn.request({
    url : url,
    method : 'GET',
    params : params,
    scope : scope,
    timeout : timeout,
    success : function(response) {
      var result = '';
      if (response) { // check that it is really OK... AZ: !! ??
        var str = '';
        try {
          result = Ext.decode(response.responseText);
          if (!result.OK)
            str = result.Message;
        } catch (e2) {
          str = "unparsable reply from the portal: " + e2.message;
        }
        if (str) {
          Ext.MessageBox.show({
            title : opname + ' fail',
            msg : str,
            buttons : Ext.MessageBox.OK,
            icon : Ext.MessageBox.ERROR
          });
          return;
        }
      }
      success.call(scope, result.Value);
    },
    failure : connectBugger(opname)
  });
}
/*-------------------------------------------------------------------------------------------------------------*/
connectBugger = function(origin) {
  //It is copied from the Step.js
  return function(response, options) {
    var str;
    if (response) {
      try {
        var result = Ext.decode(response.responseText);
        if (result.OK)
          str = "page and web service versions mismatch.";
        else
          str = result.Message;
      } catch (e2) {
        str = "unparsable reply from the portal: " + e2.message;
      }
    } else
      str = "can't communicate with portal";
    // Ext.Msg.alert('While loading '+origin, str);
    Ext.MessageBox.show({
      title : 'While loading ' + origin,
      msg : str,
      buttons : Ext.MessageBox.OK,
      icon : Ext.MessageBox.ERROR
    });
  }
}
/*-------------------------------------------------------------------------------------------------------------*/
Presenter.UrlDetail = Ext.extend(Ext.Panel, {
  //It creates a panel using a template.
  tplMarkup : [ '<b>ReportName:</b> {ReportName}<br/>',
      '<b>Type:</b> {Type}<br/>', '<b>Conditions:</b> {Conditions}<br/>',
      '<b>Grouping:</b> {Grouping}<br/>', '<b>StartTime:</b> {StartTime}<br/>',
      '<b>EndTime:</b> {EndTime}<br/>',
      '<b>ExtraArguments:</b> {ExtraArguments}<br/>' ],
  initComponent : function() {
    this.tpl = new Ext.Template(this.tplMarkup);
    Presenter.UrlDetail.superclass.initComponent.call(this);
  },
  updateDetail : function(data) {
    this.tpl.overwrite(this.body, data);
  },

  onDataChanged : function() {
    if (typeof this.Url == 'undefined')
      return;
    Presenter.GetRequest('web', 'getDetails', {
      'Url' : this.Url
    }, this, this.updateDetail);
  }
});
Ext.reg('urldetail', Presenter.UrlDetail);

/*-------------------------------------------------------------------------------------------------------------*/
function urlDetailWindow(url) {
  // It creates the window which shows a detailed information of the selected
  // plot.
  var panel = new Presenter.UrlDetail({
    Url : url
  });
  var win = new Ext.Window({
    title : 'Details of this plot: ',
    items : panel,
    Url : url,
    x : Ext.EventObject.getPageX(),
    y : Ext.EventObject.getPageY()
  });
  win.show();
  panel.onDataChanged();
}
/*-------------------------------------------------------------------------------------------------------------*/
function editPlot(url, boxID) {
  // Creates the window which store the
  // Form panel. It makes an request to the controller
  // in order to decode the selected URL.
  win = Ext.getCmp("PAMainWindow");
  if (win) {
    win.close();
    win.destroy();
  }
  gLeftSidebarPanel = createPlotAttributePanel(url, boxID);

  Ext.Ajax.request({
    url : 'getPlotDecodedParameters',
    params : {
      'Url' : url
    },
    success : getPlotDataForGivenAccountingType,
    failure : function() {
      alert("Error while decoding plot parameters");
    }
  });
}
/*-------------------------------------------------------------------------------------------------------------*/
function getPlotDataForGivenAccountingType(ajaxResponse, ajaxRequest) {
  // It is used to get all the data based on the accounting
  // typeName. The typeName is retrieved using the accounting
  // request. The typeName is one of the parameter of the
  // decoded url (The URL of the image whereat the right click
  // is performed.).
  var result = Ext.util.JSON.decode(ajaxResponse.responseText);
  if (!result.OK) {
    alert("Could not retrive the information about the plot: " + result.Message);
    return;
  }

  plotData = result.Value;

  var typeName = plotData['typeName'];
  var url = getAccountingRootUrl() + 'getPlotListAndSelectionValues';

  // get the selected attributes used to build the panel.
  // an ajax request made to the accounting system controller in order to
  // retrieve the data.
  Ext.Ajax.request({
    url : url,
    params : {
      'typeName' : typeName
    },
    success : createPlotPageWidgets,
    failure : function() {
      alert("Error while refreshing selectors");
    }
  });
}
/*-------------------------------------------------------------------------------------------------------------*/
function createPlotPageWidgets(ajaxResponse, ajaxRequest) {
  // It creates the widgets which store the accounting information.
  // The widgets are created dinamically using the information returned by the
  // accounting controller.
  var result = Ext.util.JSON.decode(ajaxResponse.responseText);
  if (!result.OK) {
    alert("Could create the plot page: " + result.Message);
    return;
  }

  var selectorData = result.Value;

  var selectionData = selectorData['SelectionData'];
  var plotsList = selectorData['PlotList'];

  appendToLeftPanel(createComboBox("plotName", "Plot to generate",
      "Select a plot", plotsList));

  var orderKeys = [];
  for (key in selectionData) {
    orderKeys.push([ key, key ]);
  }
  orderKeys.push([ 'Country', 'Country' ]);
  orderKeys.push([ 'Grid', 'Grid' ]);

  appendToLeftPanel(createComboBox("grouping", "Group by", "Select grouping",
      orderKeys));

  appendTimeSelectorToLeftPanel();

  var selWidgets = []

  for (key in selectionData) {
    selWidgets.push(createMultiselect(key, key, selectionData[key]));
  }
  var radioPanel = new Ext.form.FieldSet({
    anchor : '90%',
    title : "Selection conditions",
    name : "Selection conditions",
    collapsible : true,
    autoHeight : true,
    collapsed : true,
    triggerAction : 'all',
    items : selWidgets
  });

  appendToLeftPanel(radioPanel);

  var advWidgets = [];
  advWidgets.push(createTextField("plotTitle", "Plot title", ""));
  advWidgets.push(createCheckBox("pinDates", "Pin dates", "true"));
  advWidgets
      .push(createCheckBox("ex_staticUnits", "Do not scale units", "true"));

  var advPanel = new Ext.form.FieldSet({
    anchor : '90%',
    title : "Advanced options",
    name : "Advanced options",
    collapsible : true,
    autoHeight : true,
    collapsed : true,
    triggerAction : 'all',
    items : advWidgets
  });

  appendToLeftPanel(advPanel);

  var win = new Ext.Window({
    id : 'PAMainWindow',
    title : 'Details of this plot: ',
    items : gLeftSidebarPanel,
    autoScroll : true,
    autoHeight : false,
    autoWidth : true,
    maximizable : true,
    resizable : true,
    waitMsgTarget : true,
    waitTitle : 'Updating...',
    waitMsg : 'Loading...',
    width : 300,
    height : 550,
    minWidth : 200,
    margins : '2 0 2 2',
    cmargins : '2 2 2 2'
  });
  win.doLayout();
  win.show();
  //It creates a dictionary which contains the selected values.
  var selectValues = createProperDictionary(plotData);
  //This method is re-used from the plotPageBase.js.
  //It is used to select the values in different widgets.
  fillSelectionPanel(selectValues);
}
/*-------------------------------------------------------------------------------------------------------------*/
function createPlotAttributePanel(url, boxId)
{
  //It creates the Main panel used to store the plot related informations.
  //This plot panel is replace the Accounting main panel.
  var panel = new Ext.FormPanel({
    id : 'PlotAttributteForm',
    'BoxId':boxId,
    'Url':url,
    labelAlign : 'top',
    split : true,
    region : 'west',
    collapsible : true,
    width : 300,
    minWidth : 200,
    margins : '2 0 2 2',
    cmargins : '2 2 2 2',
    layoutConfig : {
      border : true,
      animate : true
    },
    bodyStyle : 'padding: 5px',
    title : 'Plot attribute values editor',
    buttonAlign : 'center',
    waitMsgTarget : true,
    waitTitle : 'Updating...',
    waitMsg : 'Loading...',
    autoScroll : true,
    items : [ {
      layout : 'form',
      border : false,
      buttons : [ {
        text : 'Apply',
        tooltip:'Apply these cahges to the selected plot.',
        handler : applyHandler,
        createNewTab : false
      }, {
        text : 'Apply all',
        handler : applyAllHandler,
        createNewTab : false,
        tooltip:"Apply the selected time to all plots."
      }, {
        text : 'Reset',
        tooltip:'Clear all selected values.',
        handler: cbLeftPanelResetHandler,
      }]
    } ]
  });
return panel;
}
/*-------------------------------------------------------------------------------------------------------------*/
function createProperDictionary(plotAttributtes) {
  // The decoded dictionary contains the name of the attribute values without _
  // This method is used to create a new dictionary with keys which contains _
  var selectValues = {}
  for (i in plotAttributtes) {
    if (i == 'reportName')
      selectValues["_plotName"] = plotAttributtes[i];
    else
      selectValues["_" + i] = plotAttributtes[i];
  }

  if ("condDict" in plotAttributtes) {
    // used to select the items in the select condition multiple-selection combo
    // box.
    for (i in plotAttributtes["condDict"])
      selectValues["_" + i] = plotAttributtes["condDict"][i].toString();
  }

  if ("extraArgs" in plotAttributtes) {
    for (i in plotAttributtes["extraArgs"])
      selectValues["_" + i] = plotAttributtes["extraArgs"][i].toString();
  }
  if (!("timeSelector" in selectValues))
    selectValues["_timeSelector"] = -1;
  return selectValues;
}
/*-------------------------------------------------------------------------------------------------------------*/
function parseSelectedAttributes(newValues, oldValues){
  //It collects the informations which are changed.
  for (i in oldValues) {
    if ( !(i in newValues)){
      newValues[i] = oldValues[i]
    }
  }
  return newValues;
}
/*-------------------------------------------------------------------------------------------------------------*/
function getAccountingRootUrl() {
  // We are using the accounting system to make GET requests.
  // This method used to build the root URL to the accounting
  // controller.
  var baseurl = document.location.protocol + '//' + document.location.hostname
      + gURLRoot + '/' + gPageDescription.selectedSetup;
  var url = baseurl + '/' + gPageDescription.userData.group
      + '/systems/accountingPlots/'
  return url;
}
/*-------------------------------------------------------------------------------------------------------------*/
function applyHandler(submitButton, clickEvent) {
  // When the apply button is presed the selected attributes must applied to the
  // selected plot. It aslo check the plot attributes by making a generatePlot
  // request to the accounting system.

  itemContainer = Ext.getCmp('PlotAttributteForm');
  var newparams = parseLeftPanelSelections(itemContainer);

  var oldParams = createProperDictionary(plotData);
  var params = parseSelectedAttributes(newparams, oldParams);
  var url = getAccountingRootUrl() + 'generatePlot';
  Ext.Ajax.request({
    url : url,
    params : params,
    success : applyResult,
    failure : function() {
      alert("Error while generating the plot!");
    }
  });
}
/*-------------------------------------------------------------------------------------------------------------*/
function applyResult(data) {
  // It creates a new URL and apply the change of the presenter page.
  var result = Ext.util.JSON.decode(data.responseText);
  if (!result.success) {
    window.alert("Request failed: " + result['Message'])
    return;
  }
  newUrl = getAccountingRootUrl() + "getPlotImg?file=" + result.data + " ";
  // &nocache=" + ( new Date() ).getTime();
  //Usually the nocahe parameter in the URL..., I leave it as it is now, but
  //it should be check the needs of this parameter.
  itemContainer = Ext.getCmp('PlotAttributteForm');
  boxid = itemContainer.BoxId;
  changePlot(boxid, newUrl);
  win = Ext.getCmp("PAMainWindow");
  if (win) {
    win.close();
  }
}
/*-------------------------------------------------------------------------------------------------------------*/
function changePlot(boxid, url) {
  // It changes the URL of a given picture. It means it change the selected
  // picture in the presenter page.
  try {
    var box = Ext.getCmp(boxid);
    var mainPanel = Ext.getCmp('mainConteiner');
    var index = mainPanel.items.indexOf(box);
    var newPanel = createPanel(url);
    mainPanel.remove(box);
    mainPanel.insert(index, newPanel);
    mainPanel.doLayout();
    var current = Ext.getCmp('currentID');
    if (current) {
      current.setText('Current Layout: <b>' + layout + '*</b>');
    }
  } catch (e) {
    alert('Error: ' + e.name + ': ' + e.message);
    return

  }
}
/*-------------------------------------------------------------------------------------------------------------*/
function applyAllHandler(submitButton, clickEvent) {
  // It builds a list of URL of the images and made a request to the Presenter
  // controler to decode the URL and apply the changes. As well after the result
  // selected attributes are encoded.
  try {
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    var urls = new Array();
    for ( var i = 0; i < length; i++) {
      var j = mainPanel.getComponent(i);
      if (j.id != 'welcomeMessage') {
        var tmpSrc = j.autoEl.src;
        if (tmpSrc.search(/&dummythingforrefresh/i) > 0) {
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
        }
        urls.push(tmpSrc);
      }
    }
  } catch (e) {
    alert('Error: ' + e.name + ': ' + e.message);
    return;
  }
  var change = getTimeOfSelection()

  // convert dictionaries to string
  var jchange = JSON.stringify(change);
  var jurls = JSON.stringify(urls);
  // this request to decode the url and after apply change of the time and date
  // and return the url and the encoded parameters.
  Ext.Ajax.request({
    url : 'getPlotDecodedParameters',
    params : {
      'UrlList' : jurls,
      'ReplaceTime' : jchange
    },
    success : changePlotUsingDecodedParameters,
    failure : function() {
      alert("Error while decoding plot parameters");
    }
  });
}
/*-------------------------------------------------------------------------------------------------------------*/
function changePlotUsingDecodedParameters(response, opts) {
  // This method replace all the plots using a dictionary which contains the
  // required decoded parameters which are used to create the URL.
  var result = Ext.util.JSON.decode(response.responseText);
  if (!result.OK) {
    alert("Could not retrive the information about the plot: " + result.Message);
    return;
  }
  // It is a dictionary which contains the original URl as a key and the value
  // is the decoded URL. The decoded URL contains the midified time.
  var selectedValues = result['Value'];
  // Iterates on the images and change the image using the modified url.
  try {
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    var url = new String();
    for ( var i = 0; i < length; i++) {
      var j = mainPanel.getComponent(i);
      if (j.id != 'welcomeMessage') {
        var tmpSrc = j.autoEl.src;
        if (tmpSrc.search(/&dummythingforrefresh/i) > 0) {
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
        }
        var decodedUrl = selectedValues[tmpSrc];
        var newUrl = getAccountingRootUrl() + "getPlotImg?file="
            + decodedUrl.plot + " ";
        changePlot(j.id, newUrl);
      }
    }
  } catch (e) {
    alert('Error: ' + e.name + ': ' + e.message);
    return;
  }
  win = Ext.getCmp("PAMainWindow");
  if (win) {
    win.close();
  }
}
/*-------------------------------------------------------------------------------------------------------------*/
function getTimeOfSelection() {
  // Apply all only use the time otherwise all the plots will become same. This
  // method is used to return the selected time and date.
  itemContainer = Ext.getCmp('PlotAttributteForm');
  var newparams = parseLeftPanelSelections(itemContainer);
  change = {};
  if ("_timeSelector" in newparams) {
    change["_timeSelector"] = newparams["_timeSelector"];
  }
  if ("_startTime" in newparams) {
    change["_startTime"] = newparams["_startTime"];
  }
  if ("_endTime" in newparams) {
    change["_endTime"] = newparams["_endTime"];
  }
  return change;
}
/*-------------------------------------------------------------------------------------------------------------*/
function initLoop(initValues){
  Ext.onReady(function(){
    if(window.location.hash){
      var test = window.location.hash.split('#layout=');
      if(test.length == 2 && initValues){
        initValues.defaultLayout = test[1];
      }
    }
    var mainContent = mainPanel(initValues);
    renderInMainViewport([ mainContent ]);
  });
}
function mainPanel(initValues){
  heartbeat = new Ext.util.TaskRunner();
  contextMenu = new Ext.menu.Menu();
  var current = {
    disabled:true,
    disabledClass:'my-disabled',
    id:'currentID',
    text:'Current Layout: <b>' + layout + '</b>'
  };
  var timeStamp = {
    disabled:true,
    disabledClass:'my-disabled',
    hidden:true,
    id:'timeStamp',
    text:'Updated: '
  }; 
  var add = {
    cls:"x-btn-text-icon",
    handler:function(){
      addPanel();
    },
    iconCls:'Add',
    tooltip:'Some wise tooltip here',
    text:'Add'
  };
  var set = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Save',
    id:'setLayoutButton',
    menu:createMenu('set',initValues),
    tooltip:'Read your current layout and save it on the server',
    text:'Save'
  });
  var get = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Restore',
    id:'getLayoutButton',
    menu:createMenu('get',initValues),
    tooltip:'Download your saved layout and apply it',
    text:'Load'
  });
  var act = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Act',
    id:'actLayoutButton',
    menu:[
      {handler:function(){exportLayout();},icon:gURLRoot + '/images/iface/export.gif',text:'Export'},
      {handler:function(){importLayout()},icon:gURLRoot + '/images/iface/import.gif',text:'Import'},
      {handler:function(){deleteLayout()},icon:gURLRoot + '/images/iface/close.gif',text:'Delete'},
      {handler:function(){deleteLayout('All')},icon:gURLRoot + '/images/iface/delete.gif',text:'Delete All'}
    ],
    tooltip:'',
    text:'Actions'
  });
  var column = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'columnSplitButton',
    id:'columnSplitButton',
    menu:[
      {checked:setChk('.98'),checkHandler:function(){setColumn('.98');},group:'column',text:'1 Column'},
      {checked:setChk('.49'),checkHandler:function(){setColumn('.49');},group:'column',text:'2 Columns'},
      {checked:setChk('.33'),checkHandler:function(){setColumn('.33');},group:'column',text:'3 Columns'},
      {checked:setChk('.24'),checkHandler:function(){setColumn('.24');},group:'column',text:'4 Columns'},
      {checked:setChk('.19'),checkHandler:function(){setColumn('.19');},group:'column',text:'5 Columns'}
    ],
    text:'Columns',
    tooltip:'Click to change number of columns'
  });
/*
  var refresh = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'refreshSplitButton',
    id:'refreshSplitButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){refreshYO(0,true);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){refreshYO(900000,true,'Each 15m');},group:'refresh',text:'Each 15m'},
      {checked:setChk(3600000),checkHandler:function(){refreshYO(3600000,true,'Each Hour');},group:'refresh',text:'Each Hour'},
      {checked:setChk(86400000),checkHandler:function(){refreshYO(86400000,true,'Each Day');},group:'refresh',text:'Each Day'}
    ]}),
    text:'Refresh',
    tooltip:'Click the button for manual refresh. Set autorefresh rate in the button menu',
  }); 
*/
  var refresh = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'Refresh',
    text:'Refresh',
    tooltip:'Click the button for manual refresh.'
  });
  var auto = new Ext.Toolbar.Button({
    cls:"x-btn-text",
    id:'autoButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){refreshYO(0,true);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){refreshYO(900000,true,'Each 15m');},group:'refresh',text:'15 Minutes'},
      {checked:setChk(3600000),checkHandler:function(){refreshYO(3600000,true,'Each Hour');},group:'refresh',text:'One Hour'},
      {checked:setChk(86400000),checkHandler:function(){refreshYO(86400000,true,'Each Day');},group:'refresh',text:'One Day'},
    ]}),
    text:'Disabled',
    tooltip:'Click to set the time for autorefresh'
  });
  auto.on('menuhide',function(button,menu){
    var length = menu.items.getCount();
    for(var i = 0; i < length; i++){
      if(menu.items.items[i].checked){
        button.setText(menu.items.items[i].text);
      }
    }
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding:5px;',
    defaults: {
      bodyStyle:'padding:5px'
    },
    id:'mainConteiner',
    items:[newLayout()],
    layout:'column',
    margins:'2 0 2 0',
    monitorResize:true,
    region:'center',
    tbar:[current,'->',add,'-',get,set,act,'-',refresh,'-','Auto:',auto,timeStamp,'-',column]
  });
  panel.on('render',function(){
    if(initValues){
      redoLayout(initValues,'load');
    }
  });
  return panel
}
///////////////////////////////////////////////////////
function refreshYO(delay,start,text){
  if(refeshID != 0){
    clearTimeout(refeshID);
  }
  if(delay == 0){
    clearTimeout(refeshID);
  }else{
    if(!start){
      refreshCycle();
    }
    start = false;
    refeshID = setTimeout('refreshYO(' + delay + ',false)',delay);
  }
}
function changedFlag(){
  var current = Ext.getCmp('currentID');
  if(current){
    current.setText('Current Layout: <b>' + layout + '*</b>');
  }
  document.title = layout + '*';
}
function newLayout(){
  var html = '<br><center><h1>Information Presenter</h1></center><br><p>With this page you can build your own collection of monitoring tools.';
  html = html + 'Currently only plots can be presented in a grid like layout. The layouts can be saved in the User Profile and recalled back.';
  html = html + ' You can define as many layouts as you need.</p><br>';
  html = html + '<h1>Managing layouts</h1><br><h3>Adding image</h3><p>To start with, press <b>Add</b> button and enter an image URL in the <i>Path</i> field.';
  html = html + 'You can enter any URL of a plot not only the DIRAC accounting plots. The image will be added to the layout.';
  html = html + ' The number of columns of the layout grid can be chosen with the <b>Columns</b> selector.</p>';
  html = html + '<br><h3>Removing image</h3><p>To remove an image do mouse right click on it and select <i>Remove</i> in the drop-down menu.</p>';
  html = html + '<br><h3>Saving layout</h3><p>You can always save the current layout on the server side by clicking ';
  html = html + '<b>Save</b> -&gt; <b>Save as new</b> button.</p><br><h3>Loading layout</h3>';
  html = html + '<p>If you want to load layout or to discard the changes, just click the <b>Load</b> button and select layout to restore</p>';
  html = html + '<br><h3>Exporting and importing layouts</h3><p>If you want to share your layout with others, you can choose ';
  html = html + '<b>Actions</b> -&gt; <b>Export</b> menu item and copy the layout description from a pop-up panel as a long string.';
  html = html + ' This string can now be sent to other users. To use it, choose <b>Actions</b> -&gt; <b>Import</b>';
  html = html + ' and paste the layout description.</p><center>';

  html = html + '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>';
  html = html + '</center>';
  var message = {
    anchor:'100%',
    fieldLabel:'Tip',
    columnWidth:.99,
    html:html,
    id:'welcomeMessage',
    xtype:'label'
  };
  return message
}
function setChk(value){
  if(value == columnWidth){
    return true
  }else if(value == refreshRate){
    return true
  }else{
    return false
  }
}
function menuItem(value,group){
  var item = new Ext.menu.Item({
    handler:function(item){
      if(group == 'get'){
        loadLayout(value);
      }else if(group == 'set'){
        saveLayout(value);
      }
    },
    text:value
  });
  return item
}
function createMenu(mode,init){
  var menu = new Ext.menu.Menu();
  if(init){
    if(init.layoutNames){
      var layouts = init.layoutNames;
      if(layouts.length > 0){
        layouts = layouts.split(';');
      }
    }
  }
  if(mode == 'set'){
    menu.addItem(new Ext.menu.Item({handler:function(){saveAs()},icon:gURLRoot + '/images/iface/save.gif',text:'Save as new'}));
    if(layouts){
      menu.addItem(new Ext.menu.Separator());
    }
  }
  if(mode == 'get'){
    menu.addItem(new Ext.menu.Item({handler:function(){syncLayout()},icon:gURLRoot + '/images/iface/reschedule.gif',text:'Synchronize Menues'}));
    if(layouts){
      menu.addItem(new Ext.menu.Separator());
    }
  }
  if(layouts){
    var length = layouts.length;
    for(var i=0; i<length; i++){
      if(layouts[i].length > 0){
        tmp = menuItem(layouts[i],mode);
        menu.addItem(tmp);
      }
    }
  }
  return menu
}
function resetMenu(value){
  var id = ['getLayoutButton','setLayoutButton'];
  for(var i=0; i<id.length; i++ ){
    try{
      var button = Ext.getCmp(id[i]);
      if(button){
        var tmpMenu = createMenu(id[i].slice(0,3),value);
      }
      if(button && tmpMenu){
        button.menu.removeAll();
        var length = tmpMenu.items.getCount();
        for(var j=0; j<length; j++){
          button.menu.add(tmpMenu.items.items[j]);
        }
      }
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  }
}
function refreshCycle(){
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      var j = mainPanel.getComponent(i);
      if(j.id != 'welcomeMessage'){
        var tmpSrc = j.autoEl.src;
        if(tmpSrc.search(/&dummythingforrefresh/i) > 0){
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
          tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() + '_' + Math.floor(Math.random()*101);
        }else{
          tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() + '_' + Math.floor(Math.random()*101);
        }
        var tmp = createPanel(tmpSrc);
        mainPanel.remove(i);
        mainPanel.insert(i,tmp);
        mainPanel.doLayout();
        updateTimestamp();
      }
    }
//    mainPanel.doLayout();
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
function setColumn(width){
  var button = Ext.getCmp('columnSplitButton');
  var mainPanel = Ext.getCmp('mainConteiner');
  try{
    columnWidth = width;
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      var tmp = mainPanel.getComponent(i);
      tmp.columnWidth = width;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  try{
    mainPanel.doLayout();
  }catch(e){}
}
function changeIcon(id,state){
  if(id == 'del'){
    id = 'actLayoutButton';
  }
  var button = Ext.getCmp(id);
  var btnClass = 0;
  if(id == 'getLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'getLayoutButton' && state == 'normal'){
    btnClass = 'Restore';
  }else if(id == 'setLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'setLayoutButton' && state == 'normal'){
    btnClass = 'Save';
  }else if(id == 'actLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'actLayoutButton' && state == 'normal'){
    btnClass = 'Act';
  }
  try{
    if(state == 'load'){
      button.disable();
    }else{
      button.enable();
    }
    button.setIconClass(btnClass);
  }catch(e){}
}
function gatherInfo(){
  var url = '';
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      if(mainPanel.getComponent(i).id != 'welcomeMessage'){
        var tmpSrc = mainPanel.getComponent(i).autoEl.src;
        if(tmpSrc.search(/&dummythingforrefresh/i) > 0){
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
        }
        url = url + tmpSrc + ';';
      }
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  if(url){
    url = url.replace(/&/g,'[ampersand]');
  }
  var params = {'columns':columnWidth,'refresh':refreshRate,'url':url};  
  return params
}
function syncLayout(){
  changeIcon('getLayoutButton','load');
  Ext.Ajax.request({
    failure:function(response){
      changeIcon('getLayoutButton','normal');
      AJAXerror(response.responseText);
      return false
    },
    method:'POST',
    params:{'getBookmarks':''},
    success:function(response){
      changeIcon('getLayoutButton','normal');
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        AJAXerror(response.responseText);
        return false
      }else{
        redoLayout(jsonData['result'],'sync');
      }
    },
    url:'action'
  });
}
function saveAs(){
  var params = gatherInfo();
  var title = 'Save Layout';
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    Ext.Msg.alert(title,'This is the default layout and can not be saved')
  }else{
    var msg = 'Enter the name of the new layout: ';
    Ext.Msg.prompt(title,msg,function(btn,text){
      if(btn == 'ok'){
        if(text){
          params['setBookmarks'] = text;
          changeIcon('setLayoutButton','load');
          Ext.Ajax.request({
            failure:function(response){
              changeIcon('setLayoutButton','normal');
              AJAXerror(response.responseText);
              return false
            },
            method:'POST',
            params:params,
            success:function(response){
              changeIcon('setLayoutButton','normal');
              var jsonData = Ext.util.JSON.decode(response.responseText);
              if(jsonData['success'] == 'false'){
                AJAXerror(response.responseText);
                return false
              }else{
                redoLayout(jsonData['result'],'save');
                var mainPanel = Ext.getCmp('mainConteiner');
                if(mainPanel){
                  mainPanel.doLayout();
                }
              }
            },
            url:'action'
          });
        }
      }
    });
  }
}
function saveLayout(name){
  var params = gatherInfo();
  params['setBookmarks'] = name;
  var title = 'Save Layout';
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    Ext.Msg.alert(title,'This is the default layout and can not be saved')
  }else{
    var msg = 'Save current layout to: ' + name + ' ?';
    Ext.Msg.confirm(title,msg,function(btn){
      if(btn == 'yes'){
        changeIcon('setLayoutButton','load');
        Ext.Ajax.request({
          failure:function(response){
            changeIcon('setLayoutButton','normal');
            AJAXerror(response.responseText);
            return false
          },
          method:'POST',
          params:params,
          success:function(response){
            changeIcon('setLayoutButton','normal');
            var jsonData = Ext.util.JSON.decode(response.responseText);
            if(jsonData['success'] == 'false'){
              AJAXerror(response.responseText);
              return false
            }else{
              redoLayout(jsonData['result'],'save');
              var mainPanel = Ext.getCmp('mainConteiner');
              if(mainPanel){
                mainPanel.doLayout();
              }
            }
          },
          url:'action'
        });
      }
    });
  }
}
function loadLayout(name){
  var title = 'Load Layout';
  try{
    var button = Ext.getCmp('getLayoutButton');
    var length = button.menu.items.getCount();
    if(length <= 0){
      Ext.Msg.alert(title,'Seems you do not have any layout to load');
      return;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  var msg = 'Load the layout: ' + name + ' ?';
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      changeIcon('getLayoutButton','load');
      Ext.Ajax.request({
        failure:function(response){
          changeIcon('getLayoutButton','normal');
          AJAXerror(response.responseText);
          return false
        },
        method:'POST',
        params:{'getBookmarks':name},
        success:function(response){
          changeIcon('getLayoutButton','normal');
          var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData['success'] == 'false'){
            AJAXerror(response.responseText);
            return false
          }else{
            redoLayout(jsonData['result'],'load');
            var mainPanel = Ext.getCmp('mainConteiner');
            if(mainPanel){
              mainPanel.doLayout();
            }
          }
        },
        url:'action'
      });
    }
  });
}
// change icon 'delLayoutButton'
function deleteLayout(mode){
  var title = 'Delete Layout';
  if(mode == 'All'){
    var msg = 'Do you really want to delete all layouts stored at remote service?';
    var params = {'delAllBookmarks':true};
  }else{
    var msg = 'Do you really want to delete layout: ' + layout + ' ?';
    var params = {'delBookmarks':layout};
  }
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      if(mode == 'All'){
        Ext.Msg.confirm(title,'Are you sure?',function(btn){
          if(btn == 'yes'){
            changeIcon('del','load');
            action(params,'del');
          }
        });
      }else{
        changeIcon('del','load');
        action(params,'del');
      }
    }
  });
}
function action(params,mode){
  Ext.Ajax.request({
    failure:function(response){
      changeIcon(mode,'normal');
      AJAXerror(response.responseText);
      return false
    },
    method:'POST',
    params:params,
    success:function(response){
      changeIcon(mode,'normal');
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        AJAXerror(response.responseText);
        return false
      }else{
        redoLayout(jsonData['result'],mode);
        var mainPanel = Ext.getCmp('mainConteiner');
        if(mainPanel){
          mainPanel.doLayout();
        }
      }
    },
    url:'action'
  });
}
function exportLayout(){
  var finalStr = '';
  var layoutObj = {};
  layoutObj = gatherInfo();
  for(var i in layoutObj){
    finalStr = finalStr + i + ' is equal ' + layoutObj[i] + '&';
  }
  finalStr = finalStr.replace(/;$/,"");
  Ext.Msg.alert('Export',finalStr);
}
function importLayout(){
  Ext.Msg.prompt('Import', 'Please enter the layout definition:',function(btn,text){
    if(btn == 'ok'){
      if(text){
        var finalObj = new Object;
        text = text.replace(/\n/g,'');
        var layoutObj = text.split('&');
        for(var i=0; i<layoutObj.length; i++){
          layoutObj[i] = layoutObj[i].replace(/\[ampersand\]/g,'&');
          var tmp = layoutObj[i].split(' is equal ');
          if(tmp.length == 2){
            finalObj[tmp[0]] = tmp[1];
          }
        }
        if(!finalObj.plots || !finalObj.columns || !finalObj.refresh){
          alert('Error: The format of imported data is not valid');
          return
        }else{
          redoLayout(finalObj,'import');
          var mainPanel = Ext.getCmp('mainConteiner');
          if(mainPanel){
            mainPanel.doLayout();
          }
        }
      }  
    }
  },this,true);
}
function updateTimestamp(){
  var stamp = Ext.getCmp('timeStamp');
  if(stamp){
    var d = new Date();
    var hh = d.getHours();
    if(hh < 10){
      hh = '0' + hh;
    }
    var mm = d.getMinutes()
    if(mm < 10){
      mm = '0' + mm;
    }
    stamp.setText('Updated: ' + hh + ":" + mm);
    stamp.show();
  }
}
function redoLayout(result,mode){
// ToDo set some kind of check here
  if(!result){
    return
  }
  if(mode != 'import'){
    resetMenu(result);
  }
  if(mode == 'sync'){
    return // just to update the menues
  }
  if(result.defaultLayout){
    if(result.defaultLayout == ''){
      layout = 'default';
    }else{
      layout = result.defaultLayout;
    }
  }else if(mode == 'import'){
    layout = layout + '*';
  }else{
    layout = 'default';
  }
  window.location.hash = 'layout=' + layout;
  var current = Ext.getCmp('currentID');
  if(current){
    current.setText('Current Layout: <b>' + layout + '</b>');
    document.title = layout;
  }
  updateTimestamp();
  if(result.layouts){
    for(var i in result.layouts){
      if(i == layout){
        var plotSrc = result.layouts[i]['url'];
        plotSrc = plotSrc.replace(/\[ampersand\]/g,'&');
        var plots = plotSrc.split(';');
        for(var j = 0; j < plots.length; j++){
          if(plots[j].search(/&dummythingforrefresh/i) > 0){
            plots[j] = plots[j].split('&dummythingforrefresh')[0];
          }
        }
        columnWidth = result.layouts[i]['columns'];
        refreshRate = result.layouts[i]['refresh'];
      }
    }
  }else if(mode == 'import'){
    if(result.plots){
      var plots = result.plots.split(';');
    }
  }
  var mainPanel = Ext.getCmp('mainConteiner');
  if(mainPanel){
      try{
        if(plots){
          var length = mainPanel.items.getCount() - 1;
          for(i=length; i>=0; i--){
            var tmp = mainPanel.getComponent(i);
            mainPanel.remove(tmp,true);
          }
          if(plots.length > 0){
            for(i=0; i<plots.length; i++){
              if(plots[i].length > 0){
                mainPanel.add(createPanel(plots[i]));
              }
            }
          }
        }else{
          var length = mainPanel.items.getCount() - 1;
          for(i=length; i>=0; i--){
            var tmp = mainPanel.getComponent(i);
            mainPanel.remove(tmp,true);
          }
          mainPanel.add(newLayout());
        }
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
  }
  var button = Ext.getCmp('autoButton');
  try{
    if(refreshRate == 0){
      button.menu.items.items[0].setChecked(true);
    }else if(refreshRate == 900000){
      button.menu.items.items[1].setChecked(true);
    }else if(refreshRate == 3600000){
      button.menu.items.items[2].setChecked(true);
    }else if(refreshRate == 86400000){
      button.menu.items.items[3].setChecked(true);
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  button = Ext.getCmp('columnSplitButton');
  try{
    if(columnWidth == '.98'){
      button.menu.items.items[0].setChecked(true);
    }else if(columnWidth == '.49'){
      button.menu.items.items[1].setChecked(true);
    }else if(columnWidth == '.24'){
      button.menu.items.items[3].setChecked(true);
    }else if(columnWidth == '.19'){
      button.menu.items.items[4].setChecked(true);
    }else if(columnWidth == '.33'){
      button.menu.items.items[2].setChecked(true);
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
function fullSize(link){
  var html = '<img src="' + link + '" />';
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    html:html,
    layout:'fit',
    minHeight:200,
    minWidth:320,
    title:'Actual size'
  });
  win.show();
}
function createPanel(img){
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    var mainPanel = Ext.getCmp('mainConteiner');
    mainPanel.remove(welcome);
  }
  var boxID = Ext.id();
  var box = new Ext.BoxComponent({
    autoEl:{
      tag:'img',
      style:'cursor:pointer;cursor:hand;',
      src:img
    },
    columnWidth:columnWidth,
    cls:'pointer',
    id:boxID
  });
  box.on('render',function(){
    box.el.on('click', function(evt,div,x,y,z) {
      fullSize(img);
    });
    box.el.on('contextmenu', function(evt,div,x,y,z) {
      evt.stopEvent();
      contextMenu.removeAll();
      contextMenu.add({
          handler : function() {
            editPlot(img,boxID);
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Edit'
        },{
          handler:function(){
            var mainPanel = Ext.getCmp('mainConteiner');
            mainPanel.remove(box);
            var current = Ext.getCmp('currentID');
            if(current){
              current.setText('Current Layout: <b>' + layout + '*</b>');
            }
          },
          icon:gURLRoot + '/images/iface/close.gif',
          text:'Remove'
        },{
          handler:function(){
            window.open(img)
          },
          icon:gURLRoot + '/images/iface/new-window.gif',
          text:'Open in new window'
        },{
          handler:function(){
            changeURL(boxID,img);
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Change URL'
        },{
          handler:function(){
            if(img.search(/&dummythingforrefresh/i) > 0){
              img = img.split('&dummythingforrefresh')[0];
            }
            Ext.Msg.alert('Show URL',img);
          },
          icon:gURLRoot + '/images/iface/url.gif',
          text:'Show URL'
        },{
          handler : function() {
            urlDetailWindow(img);
          },
          icon : gURLRoot + '/images/iface/info.gif',
          text : 'Plot details'
        });
      contextMenu.showAt(evt.xy);
    });
  });
  return box
}
function createTable(){
  function status(value){
  if((value == 'Done')||(value == 'Completed')||(value == 'Good')||(value == 'Active')||(value == 'Cleared')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Failed')||(value == 'Bad')||(value == 'Banned')||(value == 'Aborted')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')||(value == 'Poor')||(value == 'Probing')){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/images/monitoring/deleted.gif">';
  }else if(value == 'Matched'){
    return '<img src="'+gURLRoot+'/images/monitoring/matched.gif">';
  }else if((value == 'Running')||(value == 'Active')||(value == 'Fair')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }else if(value == 'NoMask'){
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
  }
  var reader = new Ext.data.ArrayReader({},[
    {name:'Status'},
    {name:'Number'}
  ]);
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
    {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
  ];
  var store = new Ext.data.Store({
    autoLoad:{params:{globalStat:'true'}},
    proxy: new Ext.data.HttpProxy({
      url:'https://lhcbtest.pic.es/DIRAC/LHCb-Production/diracAdmin/jobs/JobMonitor/action',
      method:'POST',
    }),
    reader:reader
  });
  var grid = new Ext.grid.GridPanel({
    columns:columns,
    header:false,
    loadMask:true,
    store:store,
    stripeRows:true,
    viewConfig:{forceFit:true}
  });
  return grid
}
function changeURL(id,url){
  var winID = Ext.id();
  var pathID = Ext.id();
  var changeValue = ''
  if((url)||(url != null)||(url != '')){
    changeValue = url;
  }
  var change = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      try{
        var pathField = Ext.getCmp(pathID);
        var path = pathField.getValue();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
      if((path == null) || (path == '')){
        alert('Textarea is empty, please input url ther')
        return
      }
      try{
        var box = Ext.getCmp(id);
        var mainPanel = Ext.getCmp('mainConteiner');
        var index = mainPanel.items.indexOf(box);
        var newPanel = createPanel(path);
        mainPanel.remove(box);
        mainPanel.insert(index,newPanel);
        mainPanel.doLayout();
        var current = Ext.getCmp('currentID');
        if(current){
          current.setText('Current Layout: <b>' + layout + '*</b>');
        }
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message)
      }
    },
    icon:gURLRoot+'/images/iface/edit.gif',
    minWidth:'150',
    tooltip:'',
    text:'Change URL'
  });
  var cancel = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message)
      }
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'100',
    tooltip:'Click here to discard changes and close the window',
    text:'Cancel'
  });
  var textarea = new Ext.form.TextArea({
    allowBlank:false,
    anchor:'100%',
    allowBlank:true,
    id:pathID,
    enableKeyEvents:true,
    fieldLabel:'Path',
    selectOnFocus:true,
    value:changeValue
  });
  var win = new Ext.Window({
    buttonAlign:'center',
    buttons:[change,cancel],
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    height:200,
    id:winID,
    items:textarea,
    layout:'fit',
    maximizable:false,
    minHeight:200,
    minWidth:320,
    title:'Create panel',
    width:320
  });
  win.on('resize',function(panel){
    newHeight = panel.getInnerHeight() - 10;
    var path = Ext.getCmp(pathID);
    path.setHeight(newHeight);
  })

  win.show();
}
function addPanel(){
  var winID = Ext.id();
  var panelID = Ext.id();
  var titleID = Ext.id();
  var pathID = Ext.id();
  var panel = new Ext.FormPanel({
    bodyStyle:'padding: 5px',
    buttonAlign:'center',
    buttons:[{
      cls:"x-btn-text-icon",
      handler:function(){
        try{
          var pathField = Ext.getCmp(pathID);
          var path = pathField.getValue();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
        if((path == null) || (path == '')){
          alert('Path is empty, please input image url')
          return
        }
        try{
          var tmpPanel = createPanel(path);
          var mainPanel = Ext.getCmp('mainConteiner');
          var newWidth = Math.round((mainPanel.getInnerWidth() - 30)/3);
          tmpPanel.setWidth(newWidth);
          mainPanel.add(tmpPanel);
          mainPanel.doLayout();
          var current = Ext.getCmp('currentID');
          if(current){
            current.setText('Current Layout: <b>' + layout + '*</b>');
          }
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
        var win = Ext.getCmp(winID);
        try{
          win.close();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message)
        }
      },
      icon:gURLRoot+'/images/iface/advanced.gif',
      minWidth:'150',
      tooltip:'Add the link in the input field to the bookmark panel',
      text:'Add Panel'
/*
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        try{
          var tmpPanel = createTable();
          var mainPanel = Ext.getCmp('mainConteiner');
          var newWidth = Math.round((mainPanel.getInnerWidth() - 30)/3);
          mainPanel.add(tmpPanel);
          mainPanel.doLayout();
          tmpPanel.setWidth(newWidth);
          tmpPanel.setHeight(newWidth);
          var current = Ext.getCmp('currentID');
          if(current){
            current.setText('Current Layout: <b>' + layout + '*</b>');
          }
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
        var win = Ext.getCmp(winID);
        try{
          win.close();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message)
        }
      },
      icon:gURLRoot+'/images/iface/advanced.gif',
      minWidth:'50',
      tooltip:' ',
      text:'Add Table'
*/
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        var win = Ext.getCmp(winID);
        try{
          win.close();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message)
        }
      },
      icon:gURLRoot+'/images/iface/reset.gif',
      minWidth:'100',
      tooltip:'Click here to discard changes and close the window',
      text:'Cancel'
    }],
    id:panelID,
    items:[{
      allowBlank:false,
      anchor:'100%',
      allowBlank:true,
      id:pathID,
      enableKeyEvents:true,
      fieldLabel:'Path',
      selectOnFocus:true,
      xtype:'textfield'
    },{
      anchor:'100%',
      fieldLabel:'Tip',
      html:'In the Path text field you can put any URL of an image. ',
      xtype:'label'
    },{
      anchor:'100%',
      fieldLabel:'Tip',
      html:'To delete the image simple do right mouse click over it and choose \'remove\' action',
      xtype:'label'
    }],
    labelAlign:'top'
  });
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    height:200,
    id:winID,
    items:[panel],
    layout:'fit',
    maximizable:false,
    minHeight:200,
    minWidth:320,
    title:'Create panel',
    width:320
  });
  win.show();
}
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  try{
    var jsonData = Ext.util.JSON.decode(response);
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return;
    }else{
      alert('data: ' + jsonData.toSource() + '\nError: Server response has wrong data structure');
      return;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
