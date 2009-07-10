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
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  if(response){
    var jsonData = Ext.util.JSON.decode(response.responseText);
  }else{
    alert('Wrong response:',response);
    alert('Error: Server response have wrong data structure');
    return;
  }
  if(jsonData){
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return;
    }else{
      alert('data:',jsonData.toSource());
      alert('Error: Server response have wrong data structure');
      return;
    }
  }else{
    alert('No json data found');
    alert('Error: Server response have wrong data structure');
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
    url:'action'
  });
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
      html = html + '" onclick="showPlot(\'' + params + '\',\'' + name + '\')" />';
      style = 'padding:0px';
    }else{
      html = 'Failed to read AJAX callback';
      style = 'padding:5px';
    }
    panel.applyStyles(style);
    panel.update(html);
  }
  return;
}
function chkBox(id){
  return '<input id="' + id + '" type="checkbox"/>';
}
function createStateMatrix(msg){
  var result = [];
  if((msg == null) || (msg == '')){
    return;
  }
  var list = Ext.getCmp('statMenu');
  if(list){
    if(list.store){
      if(list.store.totalLength > 0){
        var len = list.store.totalLength;
        for(var i = 1; i < len; i++ ){
          var j = list.store.getAt(i).data.stat;
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
function displayWin(panel,title){
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
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
  });
  window.show();
  return window;
}
function imagePanel(){
  var p0 = new Ext.Panel({
    autoScroll:false,
    collapsible:true,
    layout:'fit',
    name:'jobsBySite',
    title:'Jobs by Site:'
  });
  p0.on('activate',function(){
    alert('Yo!');
  });
  var p1 = new Ext.Panel({
    autoScroll:false,
    collapsible:true,
    layout:'fit',
    name:'jobCPUbySite',
    title:'Jobs CPU by Site:'
  });
  var p2 = new Ext.Panel({
    autoScroll:false,
    collapsible:true,
    layout:'fit',
    name:'CPUUsedBySite',
    title:'CPU used by Site:'
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    border:false,
    id:'imagePanel',
    items:[p0,p1,p2],
    labelAlign:'top',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 0',
    cmargins:'2 2 2 2',
    bodyStyle:'padding: 5px',
    buttonAlign:'left',
    title:'Graphs'
  });
  panel.on('activate',function(){
    var items = panel.items.items;
    for(var i = 0; i < items.length; i++){
      var name = items[i].name
      items[i].load({
        callback:function(panel,success,response){callBack(panel,success,response,name)},
        params:paramsSite(name),
        text:"Loading...",
        url:'action'
      });
    }
  });
  return panel;
}
function initStore(record,groupBy){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var limit = 25;
  var start = 0;
  try{
    if(dataSelect == ""){
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
  if(groupBy){
    var store = new Ext.data.GroupingStore({
      autoLoad:auto,
      groupField:groupBy,
      proxy: new Ext.data.HttpProxy({
        url:'submit',
        method:'POST',
      }),
      reader:reader
    });
  }else{
    var store = new Ext.data.Store({
      autoLoad:auto,
      proxy: new Ext.data.HttpProxy({
        url:'submit',
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
  store.on('beforeload',function(){
    try{
      store.baseParams = dataMngr.form.getForm().getValues();
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
        var value = store.baseParams.sort;
        if(value){
          var sort = value.split(' ');
          if(sort.length == 2){
            store.sort(sort[0],sort[1]);
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
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[200],[500],[1000]]
  });
  var value = 25;
  if(dataSelect){
    if(dataSelect.extra){
      if(dataSelect.extra.limit){ // Will be deleted in table function
        value = dataSelect.extra.limit/1;
      }
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
    name:'number',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:value,
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
              var sort = false;
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
                var name = dataMngr.form.items.items[i].hiddenName;
                if(result[name]){
                  var data = result[name];
                  var ccc = dataMngr.form.items.items[i].getCheckedValue();
                  for(var j = 0; j < data.length; j++){
                    data[j] = [j ,data[j][0]];
                  }
                  dataMngr.form.items.items[i].store.loadData(data);
                  var ttt = dataMngr.form.items.items[i].getRawValue();
                  if(dataMngr.form.items.items[i].displayValue){
                    value = dataMngr.form.items.items[i].displayValue;
                    value = value.split(', ');
                    for(var k = 0; k < value.length; k++){
                      for(var l = 0; l < data.length; l++){
                        if(value == data[l][1]){
                          dataMngr.form.items.items[i].setValue(l);
                        }
                      }
                    }
                    dataMngr.form.items.items[i].onRealBlur();
                  }
                }
              }
            }
          }
        }
        sideBar.body.unmask();
      },
      url:'action'
    });
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
      ['Site Descending','Site DESC']
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
function selectPanel(){
  function submitForm(){
    var selections = {};
    var sideBar = Ext.getCmp('sideBar');
    sideBar.body.mask('Sending data...');
    try{
      selections.sort = dataSelect.globalSort;
      selections.limit = tableMngr.bbar.pageSize;
      selections.start = 0;
    }catch(e){
      sideBar.body.unmask();
      alert('Error: Either selections.sort or selections.limit or selections.start are not defined');
    }
    if(tableMngr){
      if(tableMngr.bbar){
        panel.form.submit({
          params:selections,
          success:function(form,action){
            sideBar.body.unmask();
            if(action.result.success == 'false'){
              alert('Error: ' + action.result.error);
            }else{
              if(dataMngr.store){
                store = dataMngr.store;
                store.loadData(action.result);
              }else{
                alert('Error: Unable to load data to the table dataMngr.store is absent');
              }
            }
          },
          failure:function(form,action){
            sideBar.body.unmask();
            try{
              alert('Error: ' + action.response.statusText);
            }catch(e){
              alert('Error: Unknow error during sending request to service. panel.form.submit');
            }
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
    tooltip:'Refresh data in the selection boxes',
    width:'100%'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
      var number = Ext.getCmp('selectID');
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
      submitForm();
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
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
    id:'selectPanel',
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'Selections',
    url:'submit',
    waitMsgTarget:true
  });
  return panel;
}
function selectAgentTypeMenu(){
  var data = [
    [0,'All'],
    [1,'Automatic'],
    [2,'Manual']
  ];
  var disabled = false;
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'status'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'status',
    emptyText:data[0][1],
    fieldLabel:'AgentType',
    hiddenName:'agentType',
    hideOnSelect:false,
    id:'agentTypeMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  });
  combo.on({
    'render':function(){
      try{
        var agentType = dataSelect.extra.agentType.split('::: ');
        var newValue = '';
        for(var j = 0; j < agentType.length; j++){
          for(var i = 0; i < store.totalLength; i++){
            if(store.data.items[i].data.status == agentType[j]){
              if(newValue.length === 0){
                newValue = i;
              }else{
                newValue = newValue + ':::' + i;
              }
            }
          }
        }
        combo.setValue(newValue);
        delete dataSelect.extra.agentType;
      }catch(e){}
    }
  });
  return combo;
};
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
function selectAppMenu(){
  var data = [['']];
  if(dataSelect.app){
    data = dataSelect.app;
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
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
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.app){
          var appList = dataSelect.extra.app.split('::: ');
          if(store){
            var newValue = '';
            for(var j = 0; j < appList.length; j++){
              for(var i = 0; i < store.totalLength; i++){
                if(store.data.items[i].data.app == appList[j]){
                  if(newValue.length === 0){
                    newValue = i;
                  }else{
                    newValue = newValue + ':::' + i;
                  }
                }
              }
            }
            combo.setValue(newValue);
          }
        }
        delete dataSelect.extra.app;
      }
    }
  });
  return combo;
}
function selectID(){
  var value = '';
  if(dataSelect){
    if(dataSelect.extra){
      if(dataSelect.extra.id){
        value = dataSelect.extra.id;
      }
      delete dataSelect.extra.id;
    }
  }
  var regex = new RegExp( /^[0-9, ]+$/);
  var number = new Ext.form.TextField({
    anchor:'90%',
    allowBlank:true,
    enableKeyEvents:true,
    fieldLabel:'JobID',
    id:'selectID',
    mode:'local',
    name:'id',
    regex:regex,
    regexText:'Only digits separated by semicolons are allowed',
    selectOnFocus:true,
    value:value
  });
  number.on({
    'render':function(){
      if(number.value !== ''){
        hideControls(number);
      }
    },
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number;
}
function selectProductionID(){
  var value = '';
  try{
    if(dataSelect.extra.productionId){
      value = dataSelect.extra.productionId;
    }
    delete dataSelect.extra.productionId;
  }catch(e){}
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    baseChars:'0123456789',
    enableKeyEvents:true,
    fieldLabel:'ProductionID',
    id:'productionID',
    mode:'local',
    name:'productionID',
    selectOnFocus:true,
    value:value
  });
  number.on({
    'render':function(){
      if(number.value !== ''){
        hideControls(number);
      }
    },
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number;
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
  });
  return number;
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
  });
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number;
}
function createMenu(dataName,menuName,altValue){
  var data = [['']];
  try{
    data = dataSelect[dataName];
  }catch(e){}
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
  }else{
    try{
      var length = data.length;
    }catch(e){
      data = [[0,'Error, can not get data.length']];
    }
    if(altValue){
      for (var i = 0; i < length; i++) {
        data[i] = [i ,data[i][0],data[i][1]];
      }
    }else{
      for (var i = 0; i < length; i++) {
        data[i] = [i ,data[i][0]];
      }
    }
    disabled = false;
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},dataName],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:dataName,
    emptyText:data[0][1],
    fieldLabel:menuName,
    hiddenName:dataName,
    hideOnSelect:false,
    id:menuName,
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  });
  combo.on({
    'render':function(){
      try{
        var nameList = dataSelect.extra[dataName].split('::: ');
        var newValue = '';
        for(var j = 0; j < nameList.length; j++){
          for(var i = 0; i < store.totalLength; i++){
            if(store.data.items[i].data[dataName] == nameList[j]){
              if(newValue.length == 0){
                newValue = i;
              }else{
                newValue = newValue + ':::' + i;
              }
            }
          }
        }
        combo.setValue(newValue);
        delete dataSelect.extra[dataName];
      }catch(e){}
    }
  });
  return combo;
}
function selectMinorStatus(){
  var data = [['']];
  if(dataSelect.minorstat){
    data = dataSelect.minorstat;
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
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
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.minorstat){
          var minorstatList = dataSelect.extra.minorstat.split('::: ');
          if(store){
            var newValue = '';
            for(var j = 0; j < minorstatList.length; j++){
              for(var i = 0; i < store.totalLength; i++){
                if(store.data.items[i].data.minorstat == minorstatList[j]){
                  if(newValue.length === 0){
                    newValue = i;
                  }else{
                    newValue = newValue + ':::' + i;
                  }
                }
              }
            }
            combo.setValue(newValue);
          }
        }
        delete dataSelect.extra.minorstat;
      }
    }
  });
  return combo;
}
function selectOwnerMenu(){
  var data = [['']];
  if(dataSelect.owner){
    data = dataSelect.owner;
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
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
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.owner){
          var ownerList = dataSelect.extra.owner.split('::: ');
          var newValue = '';
          for(var j = 0; j < ownerList.length; j++){
            for(var i = 0; i < store.totalLength; i++){
              if(store.data.items[i].data.owner == ownerList[j]){
                if(newValue.length === 0){
                  newValue = i;
                }else{
                  newValue = newValue + ':::' + i;
                }
              }
            }
          }
          combo.setValue(newValue);
        }
        delete dataSelect.extra.owner;
      }
    }
  });
  return combo;
}
function selectPilotStatusMenu(){
  var data = [
    [0,'All'],
    [1,'Bad'],
    [2,'Fair'],
    [3,'Good'],
    [4,'Idle'],
    [5,'Poor']
  ];
  var disabled = false;
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'status'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    disabled:disabled,
    displayField:'status',
    emptyText:data[0][1],
    fieldLabel:'Status',
    hiddenName:'stat',
    hideOnSelect:false,
    id:'pilotStatusMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.pilotStatus){
          var pilotStatus = dataSelect.extra.pilotStatus.split('::: ');
          var newValue = '';
          for(var j = 0; j < pilotStatus.length; j++){
            for(var i = 0; i < store.totalLength; i++){
              if(store.data.items[i].data.status == pilotStatus[j]){
                if(newValue.length === 0){
                  newValue = i;
                }else{
                  newValue = newValue + ':::' + i;
                }
              }
            }
          }
          combo.setValue(newValue);
        }
        delete dataSelect.extra.pilotStatus;
      }
    }
  });
  return combo;
};
function selectProdMenu(){
  var menu = createMenu('prod','JobGroup');
  return menu
}
function selectProdAgentMenu(){
  var menu = createMenu('agentType','AgentType');
  return menu
}
function selectProdStatusMenu(){
  var menu = createMenu('prodStatus','Status');
  return menu
}
function selectProdTypeMenu(){
  var menu = createMenu('productionType','Type');
  return menu
}
function selectTransGroupMenu(){
  var menu = createMenu('transformationGroup','Group');
  return menu
}
function selectPluginMenu(){
  var menu = createMenu('plugin','Plugin');
  return menu
}
function selectCountryMenu(){
  var menu = createMenu('country','Country',true);
  return menu
}
function selectMaskStatusMenu(){
  var menu = createMenu('maskstatus','MaskStatus');
  return menu
}
function selectGridTypeMenu(){
  var menu = createMenu('gridtype','GridType');
  return menu
}
function selectStatusSiteSummaryMenu(){
  var menu = createMenu('status','Status');
  return menu
}
function selectSiteSummaryMenu(){
  var menu = createMenu('site','Site');
  return menu
}
function selectOwnerGroupMenu(){
  var menu = createMenu('ownerGroup','OwnerGroup');
  return menu
}
function selectCEMenu(){
  var menu = createMenu('ce','CE');
  return menu
}
function selectPilotStatusMenu(){
  var menu = createMenu('pilotStatus','Status');
  return menu
}
function selectSiteMenu(){
  var data = [['']];
  if(dataSelect.site){
    data = dataSelect.site;
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
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
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.site){
          var siteList = dataSelect.extra.site.split('::: ');
          if(store){
            var newValue = '';
            for(var j = 0; j < siteList.length; j++){
              for(var i = 0; i < store.totalLength; i++){
                if(store.data.items[i].data.site == siteList[j]){
                  if(newValue.length === 0){
                    newValue = i;
                  }else{
                    newValue = newValue + ':::' + i;
                  }
                }
              }
            }
            combo.setValue(newValue);
          }
        }
        delete dataSelect.extra.site;
      }
    }
  });
  return combo;
}
function selectStatusMenu(){
  var data = [['']];
  if(dataSelect.stat){
    data = dataSelect.stat;
  }
  var disabled = true;
  if(data == 'Nothing to display'){
    data = [[0,'Nothing to display']];
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
  });
  combo.on({
    'render':function(){
      if(dataSelect.extra){
        if(dataSelect.extra.stat){
          var statList = dataSelect.extra.stat.split('::: ');
          if(store){
            var newValue = '';
            for(var j = 0; j < statList.length; j++){
              for(var i = 0; i < store.totalLength; i++){
                if(store.data.items[i].data.stat == statList[j]){
                  if(newValue.length === 0){
                    newValue = i;
                  }else{
                    newValue = newValue + ':::' + i;
                  }
                }
              }
            }
            combo.setValue(newValue);
          }
        }
        delete dataSelect.extra.stat;
      }
    }
  });
  return combo;
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
  return Ext.Msg.alert('Show JobIDs:',url);
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
  }
  if((columnName != 'checkBox') && (columnName != 'expand')){ // column with checkboxes
    dirac.menu.removeAll();
    if(mode == 'main'){
      setMenuItems(selections);
      dirac.menu.add('-',{handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }else{
      dirac.menu.add({handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }
    dirac.menu.showAt(coords);
  }
}
function showPlot(params,plotName){
  var panel = new Ext.Panel({
    autoLoad:{
      callback:function(panel,success,response){
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
          if(win){
            win.syncSize();
          }
        }
      },
      params:params + '&img=True',
      text:"Loading...",
      url:'action'
    },
    autoScroll:true,
    border:0,
    layout:'fit',
  });
  panel.on('load',function(){
    if(panel.body.dom.firstChild){
    }
  })
  win = displayWin(panel,plotName);
  win.on(('render','resize'),function(){
    if(panel.body.dom.firstChild){
      panel.body.dom.firstChild.width = panel.getInnerWidth() - 20;
      panel.body.dom.firstChild.height = panel.getInnerHeight() - 20;
    }
  })
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
  if((value == 'Done')||(value == 'Completed')||(value == 'Good')||(value == 'Active')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Failed')||(value == 'Bad')||(value == 'Banned')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')||(value == 'Poor')){
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
function statPanel(title,mode,id){
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
  if(mode == 'global'){
    var store = new Ext.data.Store({
      autoLoad:{params:{globalStat:'true'}},
      proxy: new Ext.data.HttpProxy({
        url:'action',
        method:'POST',
      }),
      reader:reader
    });
  }else{
    var store = new Ext.data.SimpleStore({
      fields:['Status','Number'],
      data:msg
    });
  }
  var p = new Ext.grid.GridPanel({
    border:false,
    columns:columns,
    id:id,
    header:false,
    layout:'fit',
    store:store,
    stripeRows:true,
    viewConfig:{forceFit:true}
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    border:false,
    buttonAlign:'center',
    id:id + 'Panel',
    items:[p],
    labelAlign:'top',
    collapsible:true,
    width: 200,
    minWidth: 200,
    title:title
  });
  if(mode == 'global'){
    panel.addButton({
      cls:"x-btn-text-icon",
      handler:function(){
        store.load({params:{globalStat:'true'}});
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:'150',
      tooltip:'Refresh global statistics data',
      text:'Refresh'
    })
  }
  return panel;
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
  var tbar = new Ext.Toolbar({items:[]});
  if(tableMngr.tbar){
    tbar = new Ext.Toolbar({items:tableMngr.tbar});
  }
  var iNumber = itemsNumber();
  var pageSize = 25;
  if(dataSelect){
    if(dataSelect.extra){
      if(dataSelect.extra.limit){ // Will be deleted in table function
        pageSize = dataSelect.extra.limit/1;
      }
    }
  }
  tableMngr.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber,],
    pageSize:pageSize,
    refreshText:'Click to refresh current page',
    store:store
  });
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    bbar:tableMngr.bbar,
    columns:columns,
    id:'JobMonitoringTable',
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
      var hoursToSet = currentTime.getHours();
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
        var minHour = currentTime.add(Date.HOUR,-1).getHours()
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
  try{
    if(pin){
      panel.insert(8,datePin);
    }
  }catch(e){}
  return panel
}
/*
    var date = new Ext.form.DateField({
      anchor:'90%',
      allowBlank:true,
      emptyText:'YYYY-mm-dd',
//      enableKeyEvents:true,
      fieldLabel:fieldLabel,
//      fireKey:function(e){
//        manualSelection();
//      },
      format:'Y-m-d',
      name:name,
      selectOnFocus:true,
      startDay:1,
      value:'',
      width:98
    });
*/

