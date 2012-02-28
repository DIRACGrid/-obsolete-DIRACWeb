function action(type,mode,id){
  if((type == null) || (type == '')){
    alert('Item type is not defined');
    return;
  }
  if((mode == null) || (mode == '')){
    alert('Action is not defined');
    return;
  }
  var items = [];
  if((id == null) || (id == '')){
    var inputs = document.getElementsByTagName('input');
    var j = 0;
    for (var i = 0; i < inputs.length; i++){
      if (inputs[i].checked === true){
        items[j] = inputs[i].id;
        j = j + 1;
      }
    }
    if (items.length < 1){
      alert('No jobs were selected');
      return;
    }
  }else{
    items[0] = id;
  }
  var c = false;
  if (items.length == 1){
    c = confirm ('Are you sure you want to ' + mode + ' ' + type + ' ' + items[0] + '?');
  }else{
    c = confirm ('Are you sure you want to ' + mode + ' these ' + type + 's?');
  }
  if(c === false){
    return;
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
        return;
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
  });
}
function errorReport(strobj){
  var prefix = 'Error: ';
  var postfix = '';
  if(strobj.substring) {
    error = strobj;
  }else{
    error = 'Action has finished with error';
    try{
      if(strobj.failureType == 'connect'){
        error = 'Can not recieve service response';
      }
    }catch(e){}
    try{
      error = error + '\nMessage: ' + strobj.response.statusText;
    }catch(e){}
  }
  error = prefix + error + postfix;
  alert(error);
}
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  if(response){
    var jsonData = Ext.util.JSON.decode(response.responseText);
  }else{
    alert('Wrong response:' + response + '\nError: Server response have wrong data structure');
    return;
  }
  if(jsonData){
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return;
    }else{
      alert('data:' + jsonData.toSource() + '\nError: Server response have wrong data structure');
      return;
    }
  }else{
    alert('No json data found' + '\nError: Server response have wrong data structure');
    return;
  }
}
function AJAXrequest(value,id){
  try{
    gMainLayout.container.mask('Please wait');
  }catch(e){}
  var params = value + '=' + id;
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText);
    },
    method:'POST',
    params:params,
    success:function(response){
      AJAXsuccess(value,id,response.responseText);
    },
    timeout:60000, // 1min
    url:'action'
  });
}
function chkBox(id){
  return '<input id="' + id + '" type="checkbox"/>';
}
function createStateMatrix(msg){
  var result = [];
  if((msg == null) || (msg == '')){
    return;
  }
  var list = Ext.getCmp('Status');
  if(list){
    if(list.store){
      if(list.store.totalLength > 0){
        var len = list.store.totalLength;
        for(var i = 1; i < len; i++ ){
          var j = list.store.getAt(i).data.status;
          if(j){
            if(msg[j] >= 0){
              result[(i - 1)] = [j,msg[j]];
            }else{
              result[(i - 1)] = [j,"-"];
            }
          }
        }
      }
    }
  }else{
    return;
  }
  return result;
}
function dateSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'-15',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'Date',
    format:'Y-m-d',
    name:'date',
    selectOnFocus:true,
    startDay:1,
    value:''
  });
  date.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.date){
          if(dataSelect.extra.date != 'YYYY-mm-dd'){
            date.setValue(dataSelect.extra.date);
          }
        }
        delete dataSelect.extra.date;
      }
    }
  });
  return date;
}
function displayWin(panel,title,modal){
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    width:600,
    height:400,
    border:true,
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    maximizable:true,
    modal:modal,
    layout:'fit',
    plain:true,
    shim:false,
    title:title,
    items:[panel]
  });
  window.show();
  return window;
}
function initStore(record,options,id){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var limit = 25;
  var start = 0;
  try{
    if((!dataSelect)||(dataSelect == "")){
      dataSelect = {};
    }
  }catch(e){
    dataSelect = {};
  }
  try{
    if(!dataSelect.extra){
      dataSelect.extra = {};
    }
  }catch(e){
    dataSelect.extra = {};
  }
  try{
    if(!dataSelect.extra.limit){
      dataSelect.extra.limit = 25;
    }else{
      dataSelect.extra.limit = dataSelect.extra.limit/1;
    }
  }catch(e){
    dataSelect.extra.limit = 25;
  }
  try{
    if(!dataSelect.extra.start){
      dataSelect.extra.start = 0;
    }else{
      dataSelect.extra.start = dataSelect.extra.start/1;
    }
  }catch(e){
    dataSelect.extra.start = 0;
  }
  var auto = {};
  try{
    if(dataSelect.extra){
      auto = {params:dataSelect.extra};
    }else{
      auto = {params:{start:0,limit:25}};
    }
  }catch(e){
    auto = {params:{start:0,limit:25}};
  }
  var id = 'mainDataStore';
  if(options){
    if(options.auto){
      auto = false;
    }
    if(options.id){
      id = options.id;
    }
  }
  var url = 'submit';
  var groupBy = false;
  var params = [];
  if(options ){
    if(options.groupBy){
      groupBy = options.groupBy;
    }
    if(options.url){
      url = options.url;
    }
    if(options.params){
      params = options.params;
    }
  }
  if(groupBy){
    var store = new Ext.data.GroupingStore({
      autoLoad:auto,
      baseParams:params,
      groupField:groupBy,
      id:id,
      proxy: new Ext.data.HttpProxy({
        url:url,
        method:'POST',
      }),
      reader:reader
    });
  }else{
    var store = new Ext.data.Store({
      autoLoad:auto,
      baseParams:params,
      id:id,
      proxy: new Ext.data.HttpProxy({
        url:url,
        method:'POST',
        timeout:360000
      }),
      reader:reader
    });
  }
  store.on('loadexception',function(){
    try{
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
        }
      }else{
        alert("There is an exception while loading data. Please, refresh table");
      }
    }catch(e){
      alert("There is an exception while loading data. Please, refresh table");
    }
  });
  store.on('beforeload',storeLoadFunction = function(){
    try{
      var tmpSelection = dataMngr.form.getForm().getValues();
      for(var k in tmpSelection){
        store.baseParams[k] = tmpSelection[k];
      }
      store.baseParams.sort = dataSelect.globalSort;
    }catch(e){}
  });
  store.on('load',function(){
    if(store.reader){
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
        }
        if(store.reader.jsonData.extra){
          store.extra_msg = store.reader.jsonData.extra;
        }
        if(store.reader.jsonData.request){
          store.request = store.reader.jsonData.request;
        }
        var value = store.baseParams.sort;
        try{
          var sort = value.split(' ');
          if(sort.length == 2){
            store.sort(sort[0],sort[1]);
          }
        }catch(e){}
        var up = Ext.getCmp('updatedTableButton');
        if(!Ext.isEmpty(up)){
          if(store.reader.jsonData.date){
            up.setText('Updated: ' + store.reader.jsonData.date);
          }else{
            var d = new Date();
            var hh = d.getUTCHours();
            if(hh < 10){
              hh = '0' + hh;
            }
            var mm = d.getUTCMinutes();
            if(mm < 10){
              mm = '0' + mm;
            }
            var mon = d.getUTCMonth() + 1;
            if(mon < 10){
              mon = '0' + mon;
            }
            var day = d.getUTCDate();
            if(day < 10){
              day = '0' + day;
            }
            up.setText('Updated: ' + d.getUTCFullYear() + '-' + mon + '-' + day + ' ' + hh + ':' + mm + ' [UTC]');
          }
        }
      }else{
        alert("Error in store.reader.jsonData, trying to reload data store...");
        store.load();
      }
    }else{
      alert("Error in store.reader, trying to reload data store...");
      store.load();
    }
    afterDataLoad();
  });
  return store;
}
function flag(code){
  return '<img src="'+gURLRoot+'/images/flags/' + code + '.gif">';
}
function hideControls(caller){
  if(caller){
    var value = caller.getRawValue();
    var sPanel = Ext.getCmp('selectPanel');
    if(sPanel){
      var items = sPanel.items;
      if(items){
        if(value == ''){
          for(var l = 0; l < items.length; l++){
            items.items[l].enable();
          }
        }else{
          for(var i = 0; i < items.length; i++){
            var j = items.items[i];
            if((j.name == caller.name)||(j.name == 'buttons')){
              j.enable();
            }else{
              j.disable();
            }
          }
        }
      }
    }
  }
}
function itemsNumber(mainStore,id){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[200],[500],[1000]]
  });
  var value = 25;
  if(dataSelect && dataSelect.extra){
      if(dataSelect.extra.limit){ // Will be deleted in table function
        value = dataSelect.extra.limit/1;
      }
  }
  var combo = new Ext.form.ComboBox({
    allowBlank:false,
    displayField:'number',
    editable:false,
    maxLength:4,
    maxLengthText:'The maximum value for this field is 1000',
    minLength:1,
    minLengthText:'The minimum value for this field is 1',
    mode:'local',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:value,
    width:50
  });
  combo.on({
    'collapse':function(){
      if(mainStore){
        var bbar = Ext.getCmp(id);
        if(bbar){
          if(bbar.pageSize != combo.value){
            bbar.pageSize = combo.value;
            mainStore.autoLoad['params'] = {limit:combo.value};
          }
        }else{
          alert('Error: Can not get the bottombar component with id: ' + id + ' in function itemsNumber() action collapse');
          return
        }
        var sort = false;
        try{
          var sortGlobalPanel = Ext.getCmp('sortGlobalPanel');
          if(sortGlobalPanel.globalSort){
            sort = true;
          }
        }catch(e){}
        if(sort){
          mainStore.load({params:{start:0,limit:bbar.pageSize,sort:sortGlobalPanel.globalSort}});
        }else{
          mainStore.load({params:{start:0,limit:bbar.pageSize}});
        }
      }else{
        alert('Error: Can not find the mainStore in function itemsNumber() action collapse');
        return
      }
    }
  });
  return combo;
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
  return params;
}
function refreshSelect(id){
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
          var select = Ext.getCmp(id);
          if(!select){
            alert('Error: Unable to refresh components. Component with id: ' + id + ' does not exist');
            return
          }
          var length = select.items.getCount();
          for(i=0; i<length; i++){
            var tmp = select.getComponent(i);
            var name = tmp.hiddenName;
            if(result[name] && tmp.store){
              var data = result[name];
              tmp.store.loadData(data);
              var rawValue = tmp.getRawValue();
              if(rawValue){
                var separator = ', ';
                if(!Ext.isEmpty(tmp.visualseparator)){
                  separator = tmp.visualseparator;
                }else if(!Ext.isEmpty(tmp.separator)){
                  separator = tmp.separator;
                }
                value = rawValue.split(separator);
                for(var k = 0; k < value.length; k++){
                  for(var l = 0; l < data.length; l++){
                    if(value == data[l][1]){
                      tmp.setValue(l);
                    }
                  }
                }
                tmp.onRealBlur();
              }
            }
          }
        }
        sideBar.body.unmask();
      },
      url:'action'
    });
  }else{
    alert('Error: Unable to refresh components. sideBar seems does not exist');
  }
}
function sideBar(newID){
  var id = 'sideBar';
  if(newID){
    id = newID;
  }
  var panel = new Ext.Panel({
    autoScroll:true,
    id:id,
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
  });
  return panel;
}
function sortGlobalPanel(){
  function sortGlobal(value){
    dataSelect.globalSort = value;
    if(tableMngr){
      if(tableMngr.bbar){
        if(tableMngr.bbar.pageSize){
          dataMngr.store.baseParams.sort = value; 
          dataMngr.store.load({params:{start:0,limit:tableMngr.bbar.pageSize,sort:value}});
        }else{
          alert('Error: Failed to get ExtJS component: tableMngr.bbar.pageSize');
        }
      }else{
        alert('Error: Failed to get ExtJS component: tableMngr.bbar');
      }
    }else{
      alert('Error: Failed to get ExtJS component: tableMngr');
    }
  }
  function createButton(label,value,state){
    var button = new Ext.Button({
      allowDepress:false,
      enableToggle:true,
      id:value,
      minWidth:'170',
      pressed:state,
      style:'padding:2px;padding-bottom:0px;width:100%!important;',
      text:label,
      toggleGroup:'sortToggle',
      toggleHandler:function(button,state){
        if(state){
          sortGlobal(value);
        }
      }
    });
    return button;
  }
  function buttons(type){
    var value = [
      ['JobID Ascending','JobID ASC'],
      ['JobID Descending','JobID DESC'],
      ['LastUpdate Ascending','LastUpdateTime ASC'],
      ['LastUpdate Descending','LastUpdateTime DESC'],
      ['Site Ascending','Site ASC'],
      ['Site Descending','Site DESC'],
      ['Status Ascending','Status ASC'],
      ['Status Descending','Status DESC'],
      ['MinorStatus Ascending','MinorStatus ASC'],
      ['MinorStatus Descending','MinorStatus DESC']
    ];
    var defaultSort = 'JobID DESC';
    if(dataSelect.extra){
      if(dataSelect.extra.sort){
        for(var i = 0; i < value.length; i++){
          if(value[i][1] == dataSelect.extra.sort){
            defaultSort = dataSelect.extra.sort;
          }
        }
      }
      delete dataSelect.extra.sort;
    }
    var buttonArray = [];
    for(var j = 0; j < value.length; j++){
      if(value[j][1] == defaultSort){
        buttonArray[j] = createButton(value[j][0],value[j][1],true);
      }else{
        buttonArray[j] = createButton(value[j][0],value[j][1],false);
      }
    }
    dataSelect.globalSort = defaultSort;
    return buttonArray;
  }
  var p = new Ext.Panel({
    border:false,
    id:'buttonsHandler',
    items:buttons(),
    style:'padding-top:10px;width:100%'
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    border:false,
    id:'sortGlobalPanel',
    items:[p],
    labelAlign:'top',
    layout:'column',
    title:'Global Sort'
  });
  return panel;
}
function selectPanelReloaded(table){
  var refresh = new Ext.Button({
    cls:"x-btn-icon",
    handler:function(){
      refreshSelect(panel);
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'20',
    tooltip:'Refresh data in the selection boxes',
    width:'100%'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
      var number = Ext.getCmp('id');
      hideControls(number);
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.submit();
    },
    id:'submitFormButton',
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    name:'submitFormButton',
    tooltip:'Send request to the server',
    text:'Submit'
  });
  var panel = new Ext.FormPanel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset,refresh],
    collapsible:true,
    keys:[{
      key:13,
      scope:this,
      fn:function(key,e){
        panel.form.submit();
      }
    }],
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'Selections',
    url:'submit',
    waitMsgTarget:true
  });
  panel.on('beforeaction',function(form,action){
    var params = {};
    try{
      params = table.getStore().baseParams;
    }catch(e){}
    params['start'] = 0;
    params['limit'] = 25;
    try{
      params['limit'] = table.getBottomToolbar().pageSize;
    }catch(e){}
    form['baseParams'] = params;
    try{
      gMainLayout.container.mask('Sending data...');
    }catch(e){}
  });
  panel.on('actioncomplete',function(form,action){
    try{
      gMainLayout.container.unmask();
    }catch(e){}
    try{
      if(action.result.success == 'false'){
        alert('Error: ' + action.result.error);
      }else{
        table.store.loadData(action.result);
      }
    }catch(e){
      alert('');
    }
  });
  panel.on('actionfailed',function(form,action){
    try{
      gMainLayout.container.unmask();
    }catch(e){}
    errorReport(action);
  });
  return panel;
}
function selectPanel(newID){
  var id = 'selectPanel';
  try{
    if(newID){
      id = newID;
    }
  }catch(e){}
  function returnPages(id){
    var panel = Ext.getCmp(id);
    if(!panel){
      alert();
      return
    }
    var bbar = panel.getBottomToolbar();
    if(!bbar){
      alert('Error: The bottom toolbar is missing');
      return
    }
    var start = bbar.cursor;
    var page = bbar.pageSize;
    if(start || page){
      return {'start':start,'limit':page}
    }else{
      return {'start':0,'limit':25}
    }
  }
  function returnValues(){
    var selections = {};
    var tTask = returnPages('TransTaskTab');
    if(tTask.start || tTask.limit){
      selections.ttasksStart = tTask.start;
      selections.ttasksLimit = tTask.limit;
    }else{
      selections.ttasksStart = 0;
      selections.ttasksLimit = 25;
    }
    var tFiles = returnPages('TransFilesTab');
    if(tFiles.start || tFiles.limit){
      selections.tfilesStart = tFiles.start;
      selections.tfilesLimit = tFiles.limit;
    }else{
      selections.tfilesStart = 0;
      selections.tfilesLimit = 25;
    }
    var trans = returnPages('TransTab')
    if(trans.start || trans.limit){
      selections.transStart = trans.start;
      selections.transLimit = trans.limit;
    }else{
      selections.transStart = 0;
      selections.transLimit = 25;
    }
    return selections
  }
  function submitForm(panelID){
    var selections = {};
    if(panelID == 'SiteSelectPanel'){
      selections.mode = 'Site';
      var sideBar = Ext.getCmp('SiteSelectSideBar');
    }else if(panelID == 'ServiceSelectPanel'){
      selections.mode = 'Service';
      var sideBar = Ext.getCmp('ServiceSelectSideBar');
    }else if(panelID == 'ResourceSelectPanel'){
      selections.mode = 'Resource';
      var sideBar = Ext.getCmp('ResourceSelectSideBar');
    }else if(panelID == 'StorageSelectPanel'){
      selections.mode = 'Storage';
      var sideBar = Ext.getCmp('StorageSelectSideBar')
    }else if(panelID == 'transTaskSelectPanel'){
      selections = returnValues();
      selections.mode = 'Tasks';
      var sideBar = Ext.getCmp('TransTaskSelectSideBar')
    }else if(panelID == 'transFilesSelectPanel'){
      selections = returnValues();
      selections.mode = 'Files';
      var sideBar = Ext.getCmp('TransFilesSelectSideBar')
    }else if(panelID == 'transSelectPanel'){
      selections = returnValues();
      selections.mode = 'Trans';
      var sideBar = Ext.getCmp('TransSelectSideBar')
    }else{
      var sideBar = Ext.getCmp('sideBar');
    }
    var flag = 0;
    try{
      if(!sideBar.body){
        flag = 1;
        sideBar.body = gMainLayout.container;
      }
    }catch(e){
      flag = 1;
      sideBar.body = gMainLayout.container;
    }
    sideBar.body.mask('Sending data...');
    selections.start = 0;
    try{
      selections.sort = dataSelect.globalSort;
    }catch(e){
      sideBar.body.unmask();
      alert('Error: selections.sort is not defined');
    }
    try{
      selections.limit = tableMngr.bbar.pageSize;
    }catch(e){
      sideBar.body.unmask();
      alert('Error: selections.limit is not defined');
    }
//    var title = document.title + ' - ';
    var title = '';
    var addr = '?';
    var tmpPanel = Ext.getCmp(panelID);
    var tmpSelection = tmpPanel.form.getValues();
    for(var k in tmpSelection){
      if(tmpSelection[k]){
        if((tmpSelection[k]!='YYYY-mm-dd')&&(tmpSelection[k]!='00:00')&&(tmpSelection[k]!='Select time span')){
          tmpSelection[k] = tmpSelection[k].replace(/:::/g,',');
//          title = title + ' ' + k + ': "' + tmpSelection[k] + '";';
          title = title + '"' + tmpSelection[k] + '"+';
          addr = addr + k + '=' + tmpSelection[k] + '&';
        }
      }
    }
    if(title.charAt(title.length-1) == '+'){
      title = title.slice(0,title.length-1);
    }
    addr = addr.replace(/, /g,',');
    addr = addr.replace(/All,/g,'');
    title = title.replace(/All, /g,'');
    if(addr.charAt(addr.length-1) == '&'){
      addr = addr.slice(0,addr.length-1);
    }
    document.title = title;
//    window.location.hash = addr; 
    if(tableMngr){
      if(tableMngr.bbar){
        panel.form.submit({
          params:selections,
          success:function(form,action){
            sideBar.body.unmask();
            if(flag == 1){
              delete sideBar.body;
            }
            if(action.result.success == 'false'){
              alert('Error: ' + action.result.error);
            }else{
              var grid = Ext.getCmp('JobMonitoringTable');
              var dataStore = false;
              if(!Ext.isEmpty(grid)){
                dataStore = grid.getStore();
              }
              if(dataStore){
                dataStore.loadData(action.result);
              }else if(panelID == 'SiteSelectPanel'){
                var siteTable = Ext.getCmp('SiteTab');
                siteTable.store.loadData(action.result);
              }else if(panelID == 'ServiceSelectPanel'){
                var resTable = Ext.getCmp('ServiceTab');
                resTable.store.loadData(action.result);
              }else if(panelID == 'ResourceSelectPanel'){
                var resTable = Ext.getCmp('ResourceTab');
                resTable.store.loadData(action.result);
              }else if(panelID == 'StorageSelectPanel'){
                var resTable = Ext.getCmp('StorageTab');
                resTable.store.loadData(action.result);
              }else{
                alert('Error: Unable to load data to the table. Ext component mainDataStore is absent');
              }
            }
          },
          failure:function(form,action){
            sideBar.body.unmask();
            if(flag == 1){
              delete sideBar.body;
            }
            try{
              alert('Error: ' + action.response.statusText);
            }catch(e){
              alert('Error: Unknow error during sending request to service. panel.form.submit');
            }
          }
        });
      }else{
        sideBar.body.unmask();
        if(flag == 1){
          delete sideBar.body;
        }
        alert('Error: Unable to load parameters for form submition');
      }
    }else{
      sideBar.body.unmask();
      if(flag == 1){
        delete sideBar.body;
      }
      alert('Error: Unable to find data store manager');
    }
  }
  var refresh = new Ext.Button({
    cls:"x-btn-icon",
    handler:function(){
      refreshSelect(id);
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'20',
    tooltip:'Refresh data in the selection boxes',
    width:'100%'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
      var number = Ext.getCmp('id');
      hideControls(number);
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm(panel.id);
    },
    id:'submitFormButton',
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    name:'submitFormButton',
    tooltip:'Send request to the server',
    text:'Submit'
  });
  var panel = new Ext.FormPanel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset,refresh],
    collapsible:true,
    id:id,
    keys:[{
      key:13,
      scope:this,
      fn:function(key,e){
        submitForm(panel.id);
      }
    }],
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'Selections',
    url:'submit',
    waitMsgTarget:true
  });
  return panel;
}
function selectAll(selection){
  var inputs = document.getElementsByTagName('input');
  var ch = 0;
  if(selection == 'all'){
    ch = 0;
  }else if(selection == 'none'){
    ch = 1;
  }else{
    ch = 0;
  }
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type && inputs[i].type == 'checkbox'){
      if (ch === 0){
        inputs[i].checked = true;
      }else{
        inputs[i].checked = false;
      }
    }
  }
}
function genericID(name,fieldLabel,altRegex,altRegexText,hide){
  var value = '';
// Checking if value is exists for this field
  try{
    value = dataSelect.extra[name];
    delete dataSelect.extra[name];
  }catch(e){}
  var regex = new RegExp( /^[0-9, ]+$/);
  var regexText = 'Only digits separated by semicolons are allowed';
  try{
    if(altRegex){
      regex = altRegex;
    }
  }catch(e){}
  try{
    if(altRegexText){
      regexText = altRegexText;
    }
  }catch(e){}
  if((hide == null) || (hide == '')){
    hide = true;
  }
  var textField = new Ext.form.TextField({
    anchor:'-15',
    allowBlank:true,
    enableKeyEvents:true,
    fieldLabel:fieldLabel,
    id:name,
    mode:'local',
    name:name,
    regex:regex,
    regexText:regexText,
    selectOnFocus:true,
    value:value
  });
  if(hide == true){
    textField.on({
      'render':function(){
        if(textField.value !== ''){
          hideControls(textField);
        }
      },
      'blur':function(){
        hideControls(textField);
      },
      'keyup':function(){
        hideControls(textField);
      }
    });
  }
  return textField;
}
function createRemoteMenu(item){
  try{
    baseParams = {'meta':item.text};
    url = '/getmeta';
    fieldLabel = item.text;
    emptyText = 'Select value from menu';
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
  }
  var store = new Ext.data.JsonStore({
    baseParams:baseParams,
    fields:['name'],
    root:'result',
    url:url
  });
  var combo = new Ext.form.ComboBox({
    anchor:'-15',
    store:store,
    displayField:'name',
    typeAhead:true,
    fieldLabel:fieldLabel,
    forceSelection:true,
    triggerAction:'all',
    emptyText:emptyText,
    selectOnFocus:true,
  });
  return combo
}
function createMenu(dataName,title,altValue){
  var data = 'Nothing to display';
// test for dataSelect existence  
  try{
    if(!altValue){
      data = dataSelect[dataName];
    }else{
      data = altValue;
    }
  }catch(e){}
  var disabled = true;
  var error = ['Error happened on service side','Nothing to display','Insufficient rights'];
  var errorRegexp = new RegExp('^(' + error.join('|') + ')$');
  if((data == 'Nothing to display')||(Ext.isEmpty(data))){
    data = [['Nothing to display']];
  }else{
    if((!Ext.isEmpty(data[0]))&&(!Ext.isEmpty(data[0][0]))){
      if(!errorRegexp.test(data[0][0])){
        disabled = false;
      }
    }
  }
  var store = new Ext.data.SimpleStore({
    fields:['value'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'-15',
    disabled:disabled,
    displayField:'value',
    emptyText:data[0],
    fieldLabel:title,
    hiddenName:dataName ? dataName : title,
    hideOnSelect:false,
    id:title,
    mode:'local',
    resizable:true,
    separator:':::',
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'value',
    visualseparator:', '
  });
  combo.on({
    'render':function(){
      try{
        var nameList = dataSelect.extra[dataName].split(this.separator);
        var newValue = new Array();
        for(var j = 0; j < nameList.length; j++){
          var re = new RegExp(nameList[j], "g");
          if(store.find('value',re) != -1){
            newValue.push(nameList[j]);
          }
        }
        newValue = newValue.join(this.separator);
        combo.setValue(newValue);
        delete dataSelect.extra[dataName];
      }catch(e){}
    }
  });
  return combo;
}
function createDropdownMenu(dataName,title,altValue){
  var data = 'Nothing to display';
  if(altValue && altValue.constructor == Array){
    data = altValue;  
  }else{
    if(dataSelect && dataSelect[dataName] && dataSelect[dataName].constructor == Array){
      data = dataSelect[dataName];
    }
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [['Nothing to display']];
  }else{
    disabled = false;
  }
  var fields = ['value'];
  var valueField = 'value';
  if(data[0] && data[0].constructor == Array){
    fields = []
    var tmp = data[0];
    if(tmp.length > 1){
      for(var i=0; i< tmp.length; i++){
        fields.push('tmp_value_' + i);
      }
      fields.pop();
      valueField = 'tmp_value_0';
    }
    fields.push('value');
  }
  var store = new Ext.data.SimpleStore({
    fields:fields,
    data:data
  });
  var comboBox = new Ext.form.ComboBox({
    allowBlank:true,
    anchor:'-15',
    disabled:disabled,
    displayField:'value',
    emptyText:'All',
    fieldLabel:title,
    hiddenName:dataName ? dataName : title,
    hideOnSelect:false,
    id:title + 'DropdownMenu',
    resizable:true,
    store:store,
    valueField:valueField,
    typeAhead:true,
    mode:'local',
    forceSelection:true,
    triggerAction:'all',
    selectOnFocus:true,
  });
  return comboBox
}
function showJobID(separator){
  var url = 'No JobID found';
  var inputs = document.getElementsByTagName('input');
  var j = 0;
  var items = [];
  for(var k = 0; k < inputs.length; k++){
    if(inputs[k].checked === true){
      items[j] = inputs[k].id;
      j = j + 1;
    }
  }
  if(items.length < 1){
    alert('No jobs were selected');
    return;
  }else{
    var length = items.length;
    url = '';
    for(var i = 0; i < length; i++){
      if(i == length - 1){
        url = url + items[i];
      }else{
        url = url + items[i] + separator;
      }
    }
  }
  if(items.length > 100){
    panel = new Ext.Panel({border:0,autoScroll:true,html:url,layout:'fit'});
    displayWin(panel,'Show JobIDs:');
  }else{
    return Ext.Msg.alert('Show JobIDs:',url);
  }
}
function showMenu(mode,table,rowIndex,columnIndex){
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get the name for the column
  var fieldName = table.getColumnModel().getDataIndex(columnIndex); // Get field name for the column
  dirac.menu = new Ext.menu.Menu(); // Nado li?
  var coords = Ext.EventObject.xy;
  if(record.data){
    var selections = record.data;
    var value = record.get(fieldName);
    try{
      value = value.format('l, \\t\\he jS \\of F Y H:i [\\U\\TC]');
    }catch(e){}
  }
  if((columnName != 'checkBox') && (columnName != 'expand')){ // column with checkboxes
    dirac.menu.removeAll();
    if(mode == 'main'){
      setMenuItems(selections,table);
      dirac.menu.add('-',{handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }else{
      dirac.menu.add({handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }
    dirac.menu.showAt(coords);
  }
}
function showURL(){
  var url = location.protocol + '//' +  location.hostname + location.pathname + '?';
  if(dataMngr){
    if(dataMngr.form){
      var formValues = dataMngr.form.getForm().getValues();
      if(formValues){
        for(var i in formValues){
          url = url + i + '=' +  formValues[i].toString() + '&';
        }
      }
    }
  }
  if(tableMngr){
    if(tableMngr.bbar){
      url = url + 'limit' + '=' + tableMngr.bbar.pageSize + '&';
      url = url + 'start' + '=' + tableMngr.bbar.cursor + '&';
    }
  }
  if(dataSelect){
    if(dataSelect.globalSort){
      url = url + 'sort' + '=' + dataSelect.globalSort + '&';
    }
  }
  url = '<a href="' + url + '">' + url + '</a>';
  Ext.Msg.alert('Current page URL:',url);
}
function setTitle(value,id){
  var titleID = '';
  var titleValue = '';
  if((id === null) || (id === '')){
    titleID = 'Unknown';
  }else{
    titleID = id;
  }
  if((value === null) || (value === '')){
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
  return title;
}
function status(value){
  if((value == 'Done')||(value == 'Completed')||(value == 'Good')||(value == 'Active')||(value == 'Cleared')||(value == 'Completing')){
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
function statusColor(value){
  if(value == 'Done'){
    return '00BD39';
  }else if(value == 'Ready'){
    return '007B25';
  }else if(value == 'Completed'){
    return '007B25';
  }else if(value == 'Good'){
   return '238D43';
  }else if(value == 'Active'){
   return '37DE6A';
  }else if(value == 'Failed'){
   return 'FF2300';
  }else if(value == 'Aborted'){
   return 'BF4330';
  }else if(value == 'Bad'){
   return 'BF4330';
  }else if(value == 'Banned'){
   return 'FF5A40';
  }else if(value == 'Scheduled'){
   return 'FF8100';
  }else if(value == 'Waiting'){
   return 'FF8100';
  }else if(value == 'Stopped'){
   return 'FFA040';
  }else if(value == 'Poor'){
   return 'BF7830';
  }else if(value == 'Deleted'){
   return '666666';
  }else if(value == 'Matched'){
   return '025167';
  }else if(value == 'Running'){
   return '39AECF';
  }else if(value == 'Active'){
   return '61B7CF';
  }else if(value == 'Fair'){
   return '057D9F';
  }else if(value == 'NoMask'){
   return '999999';
  }else{
   return 'cccccc';
  }
}
function statPanel(title,mode,id,initCombo){
  var msg = [];
  var reader = new Ext.data.ArrayReader({},[
    {name:'Status'},
    {name:'Number'}
  ]);
  if(mode == 'text'){
    var columns = [
      {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
      {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
    ];
  }else{
    var columns = [
      {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
      {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
      {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
    ];
  }
  if(!initCombo){
    initCombo = 'Status'
  }
  var pageName = 'Undefined';
  if(gPageDescription.pageName){
    pageName = gPageDescription.pageName;
  }
  var selections = {};
  if(mode != 'global'){
    selections = {} // Selections dict here
  }
  var statsBy = 'Status';
  var params = {'stats':'none','pageName':pageName};
  var store = new Ext.data.Store({
    autoLoad:{params:{'stats':statsBy,'pageName':pageName,'selections':selections}},
    proxy: new Ext.data.HttpProxy({
      url:'action',
      method:'POST',
    }),
    reader:reader
  });
  store.on('load',function(){
    try{
      var tmpWidth = panel.getInnerWidth();
      if(grid.getInnerHeight() > panel.getInnerHeight()){
        tmpWidth = tmpWidth - 18;
      }
//      combo.setWidth(tmpWidth);
      grid.setWidth(tmpWidth);
    }catch(e){}
  });
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  var url = location.protocol + '//' + location.host + '/DIRAC/' + setup + '/' + group + '/jobs/Common/getSelections';
  var readerSelect = new Ext.data.ArrayReader({},[
    {name:'selections'}
  ]);
  var storeSelect = new Ext.data.Store({
    autoLoad:true,
    baseParams:{'selectionFor':pageName},
    proxy: new Ext.data.HttpProxy({
      method:'POST',
      url:url
    }),
    reader:readerSelect
  });
  var grid = new Ext.grid.GridPanel({
    border:false,
    columns:columns,
    id:id,
    header:false,
    layout:'fit',
    loadMask:true,
    monitorResize:true,
    store:store,
    stripeRows:true,
    viewConfig:{forceFit:true}
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    border:false,
    buttonAlign:'center',
    id:id + 'Panel',
    items:[grid],
    labelAlign:'top',
    monitorResize:true,
    collapsible:true,
    width: 200,
    minWidth: 200,
    title:title
  });
  panel.addListener('resize',function(){
    var tmpWidth = panel.getInnerWidth();
    try{
      if(grid.getInnerHeight() > panel.getInnerHeight()){
        tmpWidth = tmpWidth - 18;
      }
    }catch(e){}
    grid.setWidth(tmpWidth);
  });
  function plotButton(minWidth){
    var id = Ext.id();
    var button = new Ext.Button({
      cls:"x-btn-text-icon",
      handler:function(){
        var data = '';
        try{
          title = Ext.getCmp('sideBar').title + ': '+ title;
        }catch(e){}
        try{
          for(i=0;i<store.data.length;i++){
            var name = store.data.items[i].json[0];
            var value = store.data.items[i].json[1];
            if(value >= 1){
              data = data + name + '=' + value + '&';
            }
          }
        }catch(e){
          window.close();
          alert('Error: '+e.description)
          return
        }
        data = data.slice(0,data.length-1);
        drawPlot(data,title);
      },
      icon:gURLRoot+'/images/iface/plot.gif',
      id:id,
      minWidth:minWidth,
//      style:'padding-top:4px;padding-left:6px;',
      text:'Plot',
      tooltip:'Plot will be displayed in new window'
    });
    return button
  }
  if(mode == 'global'){
    panel.addButton({
      cls:"x-btn-text-icon",
      handler:function(){
        store.load({params:{globalStat:'true'}});
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:'100',
      tooltip:'Refresh global statistics data',
      text:'Refresh'
    })
  }
  panel.addButton(plotButton(50));
  return panel;
}
function plotButton(title,panel){
  var id = Ext.id();
  var button = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var data = '';
      try{
        var comboID = panel.id + 'Combo';
        var value = Ext.getCmp(comboID).getRawValue();
        title = panel.title + ': '+ value;
        title = Ext.getCmp('sideBar').title + ': '+ title;
      }catch(e){}
      try{
        var store = panel.getStore();
        if(store){
          for(i=0;i<store.data.length;i++){
            var name = store.data.items[i].data['Key'];
            var value = store.data.items[i].data['Value'];
            if(value >= 1){
              data = data + name + '=' + value + '&';
            }
          }
        }
      }catch(e){
        window.close();
        alert('Error: '+e.description)
        return
      }
      data = data.slice(0,data.length-1);
      drawPlot(data,title);
    },
    icon:gURLRoot+'/images/iface/plot.gif',
    id:id,
    minWidth:50,
//    style:'padding-top:4px;padding-left:6px;',
    text:'Plot',
    tooltip:'Plot will be displayed in new window'
  });
  return button
}
function selectCombo(width,store,value,id){
  var comboBox = new Ext.form.ComboBox({
    allowBlank:false,
    store:store,
    displayField:'selections',
    id:id + 'Combo',
    typeAhead:true,
    mode:'local',
    forceSelection:true,
    triggerAction:'all',
    selectOnFocus:true,
    width:width
  });
  comboBox.on('collapse',function(){
    var selector = this.getRawValue();
    var store = Ext.getCmp(id).store;
    if((store)&&(selector)){
      store.baseParams['getStat'] = selector;
      store.load();
    }
  });
  comboBox.setValue(value);
  return comboBox
}
function sPanel(title,kind,initObject){
/*
  This function is used to represent key-value pairs data. Returns a grid with a selector in top bar.
  Selector is used to make a switch between different data sources. Primary goal is to show various statistics.

  kind - is a string and basically it's the name of a controller
  initObject - object with data used to restore\set the initial state
  id - String/Int, custom id
  columns - Array or objects, none standard columns model, not sure we need it
  global - Boolean, actually used to display refresh button
  selector - String, initial value for selector dropdown menu
  initSelection - JSON object,if we need a specific selection to display initially
  auto - Boolean, should the request be sent upon the panel load
*/
  if(!kind){
    kind = 'Undefined';
  }
  var id = Ext.id();
  if((initObject) && (initObject.id)){
    id = initObject.id;
  }
  var record = new Ext.data.Record.create([
    {name:'Code'},
    {name:'Key'},
    {name:'Value'}
  ]);
  var readerGrid = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
// columns can be choose based on kind
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'Key',renderer:status,hideable:true},
    {header:'Key',width:60,sortable:true,dataIndex:'Key',align:'left'},
    {header:'Value',sortable:true,dataIndex:'Value',align:'left'}
  ];
  if((initObject) && (initObject.columns)){
    columns = initObject.columns;
  }
  var global = true
  if((initObject) && (typeof(initObject.global) !== 'undefined')){
    global = initObject.global;
  }
  var selector = 'Status';
  if((initObject) && (initObject.selector)){
    selector = initObject.selector;
  }
  var selections = {};
  if((initObject) && (initObject.initSelection)){
    selections = initObject.initSelection;
  }
  var auto = true;
  if((initObject) && (typeof(initObject.auto) !== 'undefined')){
    auto = initObject.auto;
  }
  var params = {'getStat':selector,'selections':selections};
  if(global){
    params['globalStat'] = 'true';
  }
  var storeGrid = new Ext.data.Store({
    autoLoad:auto,
    baseParams:params,
    proxy: new Ext.data.HttpProxy({
      url:'action',
      method:'POST',
    }),
    reader:readerGrid
  });
  storeGrid.on('beforeload',function(){
    var column = grid.getColumnModel();
    var selector = this.baseParams['getStat'];
    if(selector == 'Site'){
      column.setDataIndex(0,'Code');
      column.setRenderer(0,flag);
    }else{
      column.setDataIndex(0,'Key');
      if(selector == 'Status'){
        column.setRenderer(0,status);
      }else{
        column.setRenderer(0,Ext.emptyFn);
      }
    }
  });
  storeGrid.on('load',function(){
    var column = grid.getColumnModel();
    var selector = this.baseParams['getStat'];
    if((selector == 'Status')||(selector == 'Site')){
      column.setHidden(0,false);
    }else{
      column.setHidden(0,true);
    }
  });
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  var url = location.protocol + '//' + location.host + '/DIRAC/' + setup + '/' + group + '/jobs/Common/getSelections';
  var readerSelect = new Ext.data.ArrayReader({},[
    {name:'selections'}
  ]);
  var storeSelect = new Ext.data.Store({
    autoLoad:true,
    baseParams:{'selectionFor':kind},
    proxy: new Ext.data.HttpProxy({
      method:'POST',
      url:url
    }),
    reader:readerSelect
  });
  var combo = selectCombo(200,storeSelect,selector,id);
  var grid = new Ext.grid.GridPanel({
    autoScroll:true,
    border:false,
    buttonAlign:'center',
    collapsible:true,
    columns:columns,
    id:id,
    labelAlign:'top',
    loadMask:true,
    monitorResize:true,
    minWidth: 200,
    store:storeGrid,
    stripeRows:true, 
    tbar:[combo],
    title:title,
    viewConfig:{forceFit:true}
  });
  grid.addListener({'expand':function(){
    resizeCombo();
  },'resize':function(){
    resizeCombo();
  }});
  function resizeCombo(){
    var tmpWidth = grid.getInnerWidth();
    var bar = grid.getTopToolbar();
    var comboID = id + 'Combo';
    var value = Ext.getCmp(comboID).getRawValue();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    var combo = selectCombo(tmpWidth - 4,storeSelect,value,id);
    bar.add(0,combo);
  }
  if(global){
    grid.addButton({
      cls:"x-btn-text-icon",
      handler:function(){
        storeGrid.load();
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:'100',
      tooltip:'Refresh global statistics data',
      text:'Refresh'
    });
  }
  var pButton = plotButton(title,grid);
  grid.addButton(pButton);
  return grid
}
function updateStats(id,formID){
  var grid = Ext.getCmp(id);
  var combo = Ext.getCmp(id + 'Combo');
  if((grid)&&(combo)){
    var pageName = 'Undefined';
    if(gPageDescription.pageName){
      pageName = gPageDescription.pageName;
    }
    var selector = combo.getRawValue();
    var selections = '';
    if(!formID){
      formID = 'selectPanel';
    }
    var form = Ext.getCmp(formID);
    if(form){
      selections = form.getForm().getValues(); 
    }
    grid.store.baseParams = selections;//{'stats':value,'pageName':pageName,'selections':selections};
    grid.store.baseParams['getStat'] = selector
    grid.store.load();
  }else{
    var ttt = 0;
  }
}
function table(tableMngr){
  if(tableMngr.store){
    var store = tableMngr.store;
  }else{
    alert('Unable to display data. Data store is not defined');
    return;
  }
  if(tableMngr.columns){
    var columns = tableMngr.columns;
  }else{
    alert('Unable to display data. Data defenition is not defined');
    return;
  }
  if(tableMngr.title){
    var title = tableMngr.title;
  }else{
    var title = '';
  }
  if(tableMngr.view){
    var view = tableMngr.view;
  }else{
    var view = ''
  }
  if(tableMngr.viewConfig){
    var viewConfig = tableMngr.viewConfig;
  }else{
    var viewConfig = ''
  }
  if(tableMngr.id){
    var id = tableMngr.id;
  }else{
    var id = 'JobMonitoringTable';
  }
  var tbar = new Ext.Toolbar({items:[]});
  if(tableMngr.tbar){
    tbar = new Ext.Toolbar({items:tableMngr.tbar});
  }
  var iNumber = itemsNumber(store,id);
  var pageSize = 25;
  if(dataSelect){
    if(dataSelect.extra){
      if(dataSelect.extra.limit){ // Will be deleted in table function
        pageSize = dataSelect.extra.limit/1;
      }
    }
  }
  var bbarID = id + 'bbar';
  var updateStamp = new Ext.Toolbar.Button({
    disabled:true,
    disabledClass:'my-disabled',
    id:'updatedTableButton',
    text:'Updated: -'
  });
  var items = ['-',updateStamp,'-','Items per page: ',itemsNumber(store,bbarID)];
  if(tableMngr.autorefresh){
    var autorefresh = new Ext.Toolbar.Button({
      cls:"x-btn-text",
      id:'autorefreshTableButton',
      menu:tableMngr.autorefresh,
      text:'Disabled',
      tooltip:'Click to set the time for autorefresh'
    });
    autorefresh.on('menuhide',function(button,menu){
      var length = menu.items.getCount();
      for(var i = 0; i < length; i++){
        if(menu.items.items[i].checked){
          button.setText(menu.items.items[i].text);
        }
      }
    });
    items = ['-','Auto:',autorefresh,updateStamp,'-','Items per page: ',itemsNumber(store,bbarID)];
  }
  tableMngr.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    id:bbarID,
    items:items,
    pageSize:pageSize,
    refreshText:'Click to refresh current page',
    store:store
  });
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    bbar:tableMngr.bbar,
    columns:columns,
    id:id,
    labelAlign:'left',
    loadMask:true,
    margins:'2 0 2 0',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    title:title,
    tbar:tbar,
    view:view,
    viewConfig:viewConfig
  });
  store.on('load',function(){
    var date = false;
    try{
      date = store.reader.jsonData.date;
    }catch(e){}
    if(date){
      updateStamp.setText('Updated: ' + store.reader.jsonData.date);
    }else{
      var d = new Date();
      var hh = d.getUTCHours();
      if(hh < 10){
        hh = '0' + hh;
      }
      var mm = d.getUTCMinutes();
      if(mm < 10){
        mm = '0' + mm;
      }
      var mon = d.getUTCMonth() + 1;
      if(mon < 10){
              mon = '0' + mon;
      }
      var day = d.getUTCDate();
      if(day < 10){
              day = '0' + day;
      }
      var dateText = 'Updated: ' + d.getUTCFullYear() + '-' + mon + '-' + day + ' ' + hh + ':' + mm + ' [UTC]';
      updateStamp.setText(dateText);
    }
  });
  if(tableMngr.tbar == ''){
    var bar = dataTable.getTopToolbar();
    bar.hide();
  }
  return dataTable;
}
function dateTimeWidget(pin){
  function retDate(name,nameExtra,fieldLabel){
    var date = new Ext.form.DateField({
      anchor:'90%',
      allowBlank:true,
      emptyText:'YYYY-mm-dd',
      fieldLabel:fieldLabel,
      format:'Y-m-d',
      name:name,
      selectOnFocus:true,
      startDay:1,
      value:'',
      width:98
    });
    date.on({
      'render':function(){
        try{
          var sDate = dataSelect.extra[nameExtra];
          sDate = sDate.substring(0,10); // First 10 digits
          date.setValue(sDate);
          delete dataSelect.extra[nameExtra];
        }catch(e){}
      }
    });
    return date
  }
  function retTime(name,nameExtra,fieldLabel){
    var data = new Array();
    var j = 0;
    for(i=0;i<24;i++){
      var heure = '';
      if(i < 10){
        heure = i + '';
        heure = '0' + '' + heure;
      }else{
        heure = i + '';
      }
      data[j] = [heure + ':00'];
      data[j + 1] = [heure + ':30'];
      j = j + 2;
    }
    var store = new Ext.data.SimpleStore({
      fields:['time'],
      data:data
    });
    var timeField = new Ext.form.ComboBox({
      allowBlank:true,
      displayField:'time',
      editable:true,
      emptyText:'00:00',
      fieldLabel:fieldLabel,
      mode:'local',
      name:name,
      selectOnFocus:true,
      store:store,
      triggerAction:'all',
      typeAhead:true,
      width:60
    });
    timeField.on({
      'render':function(){
        try{
          var sTime = dataSelect.extra[nameExtra];
          sTime = sTime.substring(11,16); // First 5 digits
          time.setValue(sTime);
          delete dataSelect.extra[nameExtra];
        }catch(e){}
      }
    });
    return timeField
  }
  function resetButton(tmpWidth){
    var button = {
      cls:"x-btn-text-icon",
      handler:function(){
        timeSpan.reset();
        startDate.reset();
        startTime.reset();
        endDate.reset();
        endTime.reset();
      },
      icon:gURLRoot+'/images/iface/reset.gif',
      minWidth:tmpWidth,
      text:'Reset date',
      tooltip:'Click to reset values of date and time in this widget'
    }
    return button
  }
  var startDate = retDate('startDate','startDate','Start Date');
  var endDate = retDate('endDate','endDate','End Date');
  var startTime = retTime('startTime','startTime','');
  var endTime = retTime('endTime','endTime','End Time');
  var store = new Ext.data.SimpleStore({
    fields:['timeSpan'],
    data:[['Last hour'],['Last day'],['Last week'],['Last month'],['Manual selection']]
  });
  var timeSpan = new Ext.form.ComboBox({
    allowBlank:true,
    displayField:'timeSpan',
    colspan:2,
    editable:false,
    emptyText:'Select time span',
    mode:'local',
    name:'timeSpan',
    selectOnFocus:true,
    store:store,
    triggerAction:'all'
  });
  timeSpan.setWidth(158);
  timeSpan.on({
    'render':function(){
      try{
        var sTime = dataSelect.extra['timeSpan'];
        timeSpan.setValue(sTime);
        delete dataSelect.extra['timeSpan'];
      }catch(e){}
    },
    'valid':function(){
      var currentTime = new Date();
      var hoursToSet = currentTime.getUTCHours();
      if(hoursToSet < 10){
        hoursToSet = '0' + hoursToSet;
      }
      var minutesToSet = currentTime.getMinutes();
      if(minutesToSet < 10){
        minutesToSet = '0' + minutesToSet;
      }
      timeToSet = hoursToSet + ':' + minutesToSet;
      var value = timeSpan.getValue();
      if(value == 'Last hour'){
        var minHour = currentTime.add(Date.HOUR,-1).getUTCHours()
        if(minHour < 10){
          minHour = '0' + minHour;
        }
        var minMinutes = currentTime.getMinutes();
        if(minMinutes < 10){
          minMinutes = '0' + minMinutes;
        }
        startTime.setValue(minHour + ':' + minMinutes);
        startDate.setValue(currentTime);
      }else if(value == 'Last day'){
        startTime.setValue(timeToSet);
        startDate.setValue(currentTime.add(Date.DAY,-1));
      }else if(value == 'Last week'){
        startTime.setValue(timeToSet);
        startDate.setValue(currentTime.add(Date.DAY,-7));
      }else if(value == 'Last month'){
        startTime.setValue(timeToSet);
        startDate.setValue(currentTime.add(Date.MONTH,-1));
      }else if(value == 'Manual selection'){
        var startDateValue = startDate.getValue();
        if(startDateValue == ''){
          startDate.setValue(currentTime);
        }
        var endTimeValue = endTime.getValue();
        var endDateValue = endDate.getValue();
        if(endTimeValue == ''){
          endTime.setValue(timeToSet);
        }
        if(endDateValue == ''){
          endDate.setValue(currentTime);
        }
      }
      if(value == 'Manual selection'){
        panel.items.items[5].body.update('End:');
        endDate.enable();
        endTime.enable();
      }else{
        panel.items.items[5].body.update('End: <b>Now</b>');
        endDate.disable();
        endTime.disable();
      }
      delete currentTime
    }
  });
  function manualSelection(){
    var timeSpanValue = timeSpan.getValue();
    if(timeSpanValue != 'Manual selection'){
      timeSpan.setValue('Manual selection');
    }
  }
  startDate.on({
    'focus':function(){
      manualSelection();
    }
  });
  startTime.on({
    'focus':function(){
      manualSelection();
    }
  });
  
  var datePin = {xtype:'checkbox',id:'datePin',fieldLabel:'',name:'datePin',boxLabel:'Pin the date'};
  var panel = new Ext.Panel({
    layout:'table',
    id:'time-panel',
    bbar:[resetButton()],
    defaults: {
      bodyStyle:'padding:5px',
    },
    layoutConfig: {
      columns: 2
    },
    cls:'x-form-item',
    disabledClass:Ext.emptyFn,
    bodyStyle:'padding: 5px',
    items:[
      {html:'Time Span:',colspan:2,bodyStyle:'border:0px'},
      timeSpan,
      {html:'Start:',colspan:2,bodyStyle:'border:0px'},
      startDate,
      startTime,
      {html:'End: <b>Now</b>',colspan:2,bodyStyle:'border:0px'},
      endDate.disable(),
      endTime.disable()
    ],
    labelAlign:'top',
    minWidth:'170',
    width:'170'
  });
  panel.on('resize',function(){
    var tmpWidth = panel.getInnerWidth() - 6;
    var bar = panel.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,resetButton(tmpWidth));
  });
  try{
    if(pin){
      panel.insert(8,datePin);
    }
  }catch(e){}
  return panel
}
