function action(type,mode,id){
  if((type == null) || (type == '')){
    alert('Item type is not defined');
    return
  }
  if((mode == null) || (mode == '')){
    alert('Action is not defined');
    return
  }
  var items = new Array();
  if((id == null) || (id == '')){
    var inputs = document.getElementsByTagName('input');
    var j = 0;
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked == true){
        items[j] = inputs[i].id;
        j = j + 1;
      }
    }
    if (items.length < 1){
      alert('No jobs were selected');
      return
    }
  }else{
    items[0] = id;
  }
  if (items.length == 1){
    var c = confirm ('Are you sure you want to ' + mode + ' ' + type + ' ' + items[0] + '?');
  }else{
    var c = confirm ('Are you sure you want to ' + mode + ' these ' + type + 's?');
  }
  if (c == false){
    return
  }
  var params = mode + '=' + items;
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText);
    },
    method:'POST',
    params:params,
    success:function(response){
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        alert('Error: ' + jsonData['error']);
        return
      }else{
        if(jsonData.showResult){
          var html = '';
          for(var i = 0; i < jsonData.showResult.length; i++){
            html = html + jsonData.showResult[i] + '<br>';
          }
          Ext.Msg.alert('Result:',html);
        }
        if(dataMngr){
          if(dataMngr.store){
            if(dataMngr.store.autoLoad){
              if(dataMngr.store.autoLoad.params){
                if(dataMngr.store.autoLoad.params.limit){
                  dataMngr.store.load({params:{start:0,limit:dataMngr.store.autoLoad.params.limit}});
                }
              }
            }
          }
        }
      }
    },
    url:'action'
  })
}
function AJAXerror(response){
  if(response){
    var jsonData = Ext.util.JSON.decode(response.responseText);
  }else{
    alert('Wrong response:',response);
    alert('Error: Server response have wrong data structure');
    return 
  }
  if(jsonData){
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return
    }else{
      alert('data:',jsonData.toSource());
      alert('Error: Server response have wrong data structure');
      return
    }
  }else{
    alert('No json data found');
    alert('Error: Server response have wrong data structure');
    return
  }
}
function AJAXrequest(value,id){
  var params = value + '=' + id;
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText)
    },
    method:'POST',
    params:params,
    success:function(response){
      AJAXsuccess(value,id,response.responseText)
    },
    url:'action'
  })
}
function callBack(panel,success,response){
  if(success){
    var name = response.argument.params;
    name = name.split('type=');
    name = name[1];
    var html = '';
    var jsonData = Ext.util.JSON.decode(response.responseText);
    var addres = location.protocol + '//' +  location.hostname + gURLRoot + '/';
    var style = '';
    var params = '';
    if(response){
      if(response.argument){
        if(response.argument.params){
          params = response.argument.params;
        }
      }
    }
    if(jsonData.error){
      html = jsonData.error;
      style = 'padding:5px';
    }else if(jsonData.result){
      var fullsize = jsonData.result;
      fullsize = addres + 'systems/accountingPlots/getPlotImg?file=' + fullsize;
      html = html + '<img style="cursor: pointer; cursor: hand;" src="' + fullsize;
      html = html + '" onclick="tab(\'' + params + '\',\'' + name + '\')" />';
      style = 'padding:0px';
    }else{
      html = 'Failed to read AJAX callback';
      style = 'padding:5px';
    }
    panel.applyStyles(style);
    panel.update(html);
  }
  return
}
function callBackTab(panel,success,response){
  if(success){
    var html = '';
    var jsonData = Ext.util.JSON.decode(response.responseText);
    var addres = location.protocol + '//' +  location.hostname + gURLRoot + '/';
    var style = '';
    if(jsonData.error){
      html = jsonData.error;
      style = 'padding:5px';
    }else if(jsonData.result){
      var fullsize = jsonData.result;
      fullsize = addres + 'systems/accountingPlots/getPlotImg?file=' + fullsize;
      html = html + '<img src="' + fullsize + '" />';
      style = 'padding:10px';
    }else{
      html = 'Failed to read AJAX callback';
      style = 'padding:5px';
    }
    panel.applyStyles(style);
    panel.update(html);
 //   panel.center();
  }
  return
}
function dateSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'Date',
    format:'Y-m-d',
    name:'date',
    selectOnFocus:true,
    startDay:1,
    value:''
  });
  return date
}
function displayWin(panel,title){
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    autoScroll:true,
    width:600,
    height:350,
    border:true,
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    maximizable:true,
    layout:'fit',
    plain:true,
    shim:false,
    title:title,
    items:[panel]
  })
  var z = panel;
  window.show()
}
function initStore(record){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var store = new Ext.data.Store({
    autoLoad:{params:{start:0,limit:25}},
    proxy: new Ext.data.HttpProxy({
      url:'submit',
      method:'POST'
    }),
    reader:reader
  });
  store.on('beforeload',function(){
/*
    if(dataMngr){
      if(dataMngr.form){
        store.baseParams = dataMngr.form.getForm().getValues();
      }
    }
    if(dataSelect){
      if(dataSelect.extra){
        for(var i in dataSelect.extra){
          store.baseParams[i] = dataSelect.extra[i];
        }
      }
    }
    var sortGlobalPanel = Ext.getCmp('sortGlobalPanel');
    if(sortGlobalPanel){
      if(sortGlobalPanel.globalSort){
         store.baseParams.sort = sortGlobalPanel.globalSort;
      }
    }
  });
  store.on('load',function(){
    if(store.reader){
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
          return
        }
      }
    }
    afterDataLoad();
*/
  });
  return store
}
function selectFinalDate(){
  var today = new Date();
  var limit = new Date();
  limit.setDate(limit.getDate() - 30);
  var month = today.getMonth() + 1;
  if(month < 10){
    month = '0' + month;
  }
  var day = today.getDate()
  if(day < 10){
    day = '0' + day;
  }
  var value = today.getFullYear() + '-' + month + '-' + day;
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:value,
    fieldLabel:'Final Date',
    format:'Y-m-d',
    maxValue:today,
    minValue:limit,
    name:'finalDate',
    selectOnFocus:true,
    startDay:1,
    value:value
  });
  return date
}
function selectStartDate(){
  var today = new Date();
  var limit = new Date();
  limit.setDate(limit.getDate() - 30);
  var month = limit.getMonth() + 1;
  if(month < 10){
    month = '0' + month;
  }
  var day = limit.getDate()
  if(day < 10){
    day = '0' + day;
  }
  var value = limit.getFullYear() + '-' + month + '-' + day;
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:value,
    fieldLabel:'Start Date',
    format:'Y-m-d',
    maxValue:today,
    minValue:limit,
    name:'startDate',
    selectOnFocus:true,
    startDay:1,
    value:value
  });
  return date
}
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[200],[500],[1000]]
  });
  var combo = new Ext.form.ComboBox({
    allowBlank:false,
    displayField:'number',
    editable:false,
    maxLength:4,
    maxLengthText:'The maximum value for this field is 1000',
    minLength:1,
    minLengthText:'The minimum value for this field is 1',
    mode:'local',
    name:'number',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:25,
    width:50
  });
  combo.on({
    'collapse':function(){
      if(dataMngr.store){
        if(tableMngr.bbar){
          if(tableMngr.bbar.pageSize){
            if(tableMngr.bbar.pageSize != combo.value){
              tableMngr.bbar.pageSize = combo.value;
              dataMngr.store.autoLoad.params.limit = combo.value;
              var sortGlobalPanel = Ext.getCmp('sortGlobalPanel');
              var sort = false
              if(sortGlobalPanel){
                if(sortGlobalPanel.globalSort){
                  sort = true;
                }
              }
              if(sort){
                dataMngr.store.load({params:{start:0,limit:tableMngr.bbar.pageSize,sort:sortGlobalPanel.globalSort}});
              }else{
                dataMngr.store.load({params:{start:0,limit:tableMngr.bbar.pageSize}});
              }
            }
          }
        }
      }
    }
  });
  return combo
}
function paramsSite(type){
  var params = '';
  if(dataMngr){
    if(dataMngr.form){
      params = dataMngr.form.getForm().getValues();
    }
  }
  if(params.site){
    params = 'getPlotSrc=' + params.site;
  }else{
    params = 'getPlotSrc=' + 'All';
  }
  params  = params.replace(/::: /g,',');
  params = params + "&type=" + type;
  return params
}
function refreshSelect(){
  var sideBar = Ext.getCmp('sideBar');
  var params = 'refreshSelection=true';
  if(sideBar){
    sideBar.body.mask('Loading...');
    Ext.Ajax.request({
      failure:function(response){
        sideBar.body.unmask();
        AJAXerror(response.responseText);
      },
      method:'POST',
      params:params,
      success:function(response){
        var result = Ext.util.JSON.decode(response.responseText);
        if(result){
          for(var i = 0; i < dataMngr.form.items.items.length; i++){
            if(dataMngr.form.items.items[i].store){
              if(dataMngr.form.items.items[i].hiddenName){
                var name = dataMngr.form.items.items[i].hiddenName
                if(result[name]){
                  var data = result[name];
                  for(var j = 0; j < data.length; j++){
                    data[j] = [j ,data[j][0]];
                  }
                  dataMngr.form.items.items[i].store.loadData(data);
                  if(dataMngr.form.items.items[i].displayValue){
                    value = dataMngr.form.items.items[i].displayValue.replace(/,/g,':::')
                    dataMngr.form.items.items[i].setValue(value);
                  }
                }
              }
            }
          }
        }
        sideBar.body.unmask();
      },
      url:'action'
    })
  }else{
    alert('Unable to refresh components');
  }
}
function sideBar(){
  var panel = new Ext.Panel({
    autoScroll:true,
    id:'sideBar',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 0',
    cmargins:'2 2 2 2',
    buttonAlign:'left',
    title:'DIRAC SideBar',
    layout:'accordion',
    layoutConfig:{
      titleCollapse:true,
      activeOnTop:false,
      border:false
    }
  })
  return panel
}
function selectPanel(){
  function submitForm(){
    var selections = {};
    var sideBar = Ext.getCmp('sideBar');
    sideBar.body.mask('Sending data...');
    if(tableMngr){
      if(tableMngr.bbar){
        var sortGlobalPanel = Ext.getCmp('sortGlobalPanel');
        if(sortGlobalPanel){
          if(sortGlobalPanel.globalSort){
            selections.sort = sortGlobalPanel.globalSort;
          }
        }
        selections.limit = tableMngr.bbar.pageSize;
        selections.start = 0;
        panel.form.submit({
          params:selections,
          success:function(form,action){
            if(action.result.success == 'false'){
              sideBar.body.unmask();
              alert('Error: ' + action.result.error);
            }else{
              if(dataMngr.store){
                var tabPanel = Ext.getCmp('tabPanel');
                if(tabPanel){
                  var activeTab = Ext.getCmp('JobMonitoringTable');
                  if(activeTab){
                    tabPanel.setActiveTab(activeTab);
                  }
                }
                store = dataMngr.store;
                store.loadData(action.result);
                sideBar.body.unmask();
              }else{
                sideBar.body.unmask();
                alert('Error: Unable to load data to the table');
              }
            }
          },
          failure:function(form,action){
            sideBar.body.unmask();
            alert('Error: ' + action.response.statusText);
          }
        });
      }else{
        sideBar.body.unmask();
        alert('Error: Unable to load parameters for form submition');
      }
    }else{
      sideBar.body.unmask();
      alert('Error: Unable to find data store manager');
    }
  }
  var refresh = new Ext.Button({
    cls:"x-btn-icon",
    handler:function(){
      refreshSelect();
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'20',
    tooltip:'Click to refresh data in the selection boxes',
    width:'100%'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Click to reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm();
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    tooltip:'Click to send request to the server',
    text:'Submit'
  });
  var panel = new Ext.FormPanel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset,refresh],
    collapsible:true,
    id:'selectPanel',
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'Selections',
    url:'submit',
    waitMsgTarget:true,
  })
  return panel
}
function selectAll(selection){
  var inputs = document.getElementsByTagName('input');
  if(selection == 'all'){
    var ch = 0;
  }else if(selection == 'none'){
    var ch = 1;
  }else{
    var ch = 0;
  }
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type && inputs[i].type == 'checkbox'){
      if (ch == 0){
        inputs[i].checked = true;
      }else{
        inputs[i].checked = false;
      }
    }
  }
}

function selectGlobalSortID(){
  var data = [['JobID Ascending'],['JobID Descending']]
  var store = new Ext.data.SimpleStore({
    fields:['app'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    displayField:'app',
    editable:false,
    emptyText:data[0],
    fieldLabel:'Sort by',
    hiddenName:'sortByJobID',
    hideOnSelect:true,
    id:'sortJobID',
    mode:'local',
    resizable:true,
    name:'sortJobID',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'app'
  })
  return combo
}
function selectAppMenu(){
  if(dataSelect.app){
    var data = dataSelect.app;
  }else{
    var data = [['']];
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'app'],
    data:data
  });

  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'app',
    emptyText:data[0][1],
    fieldLabel:'Application status',
    hiddenName:'app',
    hideOnSelect:false,
    id:'appMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    baseChars:'0123456789',
    enableKeyEvents:true,
    fieldLabel:'JobID',
    mode:'local',
    name:'id',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
function selectRequest(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'RequestID',
    mode:'local',
    name:'RequestID',
    selectOnFocus:true,
    value:''
  })
  return number
}
function selectRequestID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    baseChars:'0123456789',
    enableKeyEvents:true,
    fieldLabel:'RequestID',
    mode:'local',
    name:'reqId',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
function selectMinorStatus(){
  if(dataSelect.minorstat){
    var data = dataSelect.minorstat;
  }else{
    var data = [['']];
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'minorstat'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'minorstat',
    emptyText:data[0][1],
    fieldLabel:'Minor status',
    hiddenName:'minorstat',
    hideOnSelect:false,
    id:'minorstatMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectOwnerMenu(){
  if(dataSelect.owner){
    var data = dataSelect.owner;
  }else{
    var data = [['']];
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'owner'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'owner',
    emptyText:data[0][1],
    fieldLabel:'Owner',
    hiddenName:'owner',
    hideOnSelect:false,
    id:'ownerMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectProdMenu(){
  if(dataSelect){
    if(dataSelect.prod){
      var data = dataSelect.prod;
    }else{
      var data = [['']];
    }
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'prod'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'prod',
    emptyText:data[0][1],
    fieldLabel:'JobGroup',
    hiddenName:'prod',
    hideOnSelect:false,
    id:'prodMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.prod){
          if(store){
            for(var i = 0; i < store.totalLength; i++){
              if(store.data.items[i].data.prod == dataSelect.extra.prod){
                combo.setValue(i);
              }
            }
          }
        }
      }
    }
  })
  return combo
}
function selectSiteMenu(){
  if(dataSelect.site){
    var data = dataSelect.site;
  }else{
    var data = [['']];
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'site'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'site',
    emptyText:data[0][1],
    fieldLabel:'DIRAC Site',
    hiddenName:'site',
    hideOnSelect:false,
    id:'siteMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectStatusMenu(){
  if(dataSelect.stat){
    var data = dataSelect.stat;
  }else{
    var data = [['']];
  }
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
    disabled = true;
  }else{
    for (var i = 0; i < data.length; i++) {
      data[i] = [i ,data[i][0]];
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'stat'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'stat',
    emptyText:data[0][1],
    fieldLabel:'Status',
    hiddenName:'stat',
    hideOnSelect:false,
    id:'statMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  var refresh = new Ext.Button({
    text:'Refresh'
  })
  return (refresh, combo)
}
function showMenu(table,rowIndex,columnIndex){
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get field name for the column
  dirac.menu = new Ext.menu.Menu(); // Nado li?
  var coords = Ext.EventObject.xy;
  if(record.data){
    selections = record.data;
  }
  if(columnName != 'checkBox'){ // column with checkboxes
    dirac.menu.removeAll();
    setMenuItems(selections);
    dirac.menu.showAt(coords);
  }
}
function showURL(){
  var url = location.protocol + '//' +  location.hostname + location.pathname + '?';
  if(dataMngr){
    if(dataMngr.form){
      var formValues = dataMngr.form.getForm().getValues();
      for(var i in formValues){
        url = url + i + '=' +  formValues[i].toString() + '&';
      }
    }
  }
  if(tableMngr){
    if(tableMngr.bbar){
      url = url + 'limit' + '=' +  tableMngr.bbar.pageSize + '&';
      url = url + 'start' + '=' +  tableMngr.bbar.cursor + '&';
    }
  }
  var html = '<pre>' + url + '</pre>';
  Ext.Msg.alert('Current page URL:',url);
  alert(url);
}
function setTitle(value,id){
  var titleID = '';
  var titleValue = '';
  if((id == null) || (id == '')){
    titleID = 'Unknown';
  }else{
    titleID = id;
  }
  if((value == null) || (value == '')){
    titleValue = 'Unknown window for item with ID: ';
  }else{
    if(value == 'getJDL'){
      titleValue = 'JDL for JobID: ';
    }else if(value == 'getBasicInfo'){
      titleValue = 'Attributes for JobID: ';
    }else if(value == 'getParams'){
      titleValue = 'Parameters for JobID: ';
    }else if(value == 'LoggingInfo'){
      titleValue = 'Logging info for JobID: ';
    }else if(value == 'getStandardOutput'){
      titleValue = 'Standard output for JobID: ';
    }else if(value == 'LogURL'){
      titleValue = 'Log file(s) for JobID: ';
    }else if(value == 'getStagerReport'){
      titleValue = 'Stager report for JobID: ';
    }else if(value == 'pilotStdOut'){
      titleValue = 'Pilot StdOut for JobID: ';
    }else if(value == 'pilotStdErr'){
      titleValue = 'Pilot StdErr for JobID: ';
    }else if(value == 'log'){
      titleValue = 'Logs for JobGroup ID: ';
    }else if(value == 'getPending'){
      titleValue = 'Pending Request(s) for JobID: ';
    }else{
      titleValue = 'Item ID: ';
    }
  }
  title = titleValue + titleID;
  return title
}
function status(value){
  if((value == 'Done')||(value == 'Completed')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if(value == 'Failed'){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/images/monitoring/deleted.gif">';
  }else if(value == 'Matched'){
    return '<img src="'+gURLRoot+'/images/monitoring/matched.gif">';
  }else if((value == 'Running')||(value == 'Active')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
}
function tab(params,plotName){
  var timeout = 150;
  var tabPanel = Ext.getCmp('tabPanel');
  if(tabPanel){
    var panel = new Ext.Panel({
      autoLoad:{
        callback:function(panel,success,response){callBackTab(panel,success,response)},
        params:params + '&img=True',
        timeout:timeout,
        text:"Loading...",
        url:'action'
      },
      autoScroll:true,
      border:0,
      closable:true,
      layout:'fit',
      title:plotName
    });
    tabPanel.add(panel);
    tabPanel.setActiveTab(panel);
  }
}
function table(tableMngr){
  if(tableMngr.store){
    var store = tableMngr.store;
  }else{
    alert('Unable to display data. Data store is not defined');
    return
  }
  if(tableMngr.columns){
    var columns = tableMngr.columns;
  }else{
    alert('Unable to display data. Data defenition is not defined');
    return
  }
  if(tableMngr.title){
    var title = tableMngr.title;
  }else{
    title = 'Unknown';
  }
  if(tableMngr.tbar){
    var tbar = new Ext.Toolbar({
      items:tableMngr.tbar
    })
  }else{
    var tbar = new Ext.Toolbar({
      items:[]
    })
  }
  var iNumber = itemsNumber();
  tableMngr.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber],
    pageSize:25,
    refreshText:'Click to refresh current page',
    store:store
  })
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    autoWidth:true,
    bbar:tableMngr.bbar,
    collapsible:true,
    columns:columns,
    id:'JobMonitoringTable',
    labelAlign:'left',
    loadMask:true,
    margins:'2 2 2 2',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    title:title,
    tbar:tbar,
    viewConfig:{forceFit:true}
  });
//  var colModel = dataTable.getColumnModel();
//  tableMngr.store.on({
//    'load':function(){
//      var j = 0;
//      for(var c = 1; c < colModel.getColumnCount(); c++){
//        if(!colModel.isHidden(c)){
//          j++;
//          var w = 10;
//          colModel.setColumnWidth(c,w);
//          w = dataTable.view.getHeaderCell(c).firstChild.scrollWidth;
//          w = Math.max(w,dataTable.view.getCell(1, c).firstChild.scrollWidth);
//          w = w + 5;
//          colModel.setColumnWidth(c,w);
//        }
//      }
//    }


//  tableMngr.store.on({
//    'load':function(){
//      for(var c = 1; c < colModel.getColumnCount(); c++){
//        var ttt = colModel.totalWidth;
//        var hhh = dataTable.view.lastViewWidth;
////        if(colModel.totalWidth > dataTable.view.lastViewWidth){
//          if(!colModel.isHidden(c)){
//            var w = 10;
//            colModel.setColumnWidth(c,w);
//            w = dataTable.view.getHeaderCell(c).firstChild.scrollWidth;
//            for(var i = 0, l = store.getCount(); i < l; i++){
//              w = Math.max(w,dataTable.view.getCell(i, c).firstChild.scrollWidth);
//            }
//            w = w + 5;
//            colModel.setColumnWidth(c,w);
//          }
//        }
////      }
//    }
//  })
  return dataTable
}
function mainClick(item){
  var m = item;
  location.pathname = item.text;
  location.reload();
}
