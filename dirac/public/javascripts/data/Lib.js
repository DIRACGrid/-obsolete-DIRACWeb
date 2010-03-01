//Ext.Ajax.on('beforerequest',this.showSpinner,this);
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
      alert('No items were selected');
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
        if(dataMngr.store){
          dataMngr.store.load();
        }
      }
    },
    url:'action'
  })
}
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  var jsonData = Ext.util.JSON.decode(response.responseText);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }else{
    alert('Error: Data structure is corrupted');
    return
  }
}
function AJAXrequest(value,id){
  try{
    gMainLayout.container.mask('Please wait');
  }catch(e){}
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
function chkBox(id){
  return '<input id="' + id + '" type="checkbox"/>'
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
      data = [[0,'Error: Can\'t get data.length']];
    }
    if(altValue){
      for (var i = 0; i < length; i++) {
        data[i] = [i ,data[i][0],data[i][1]];
      }
    }else{
      for (var i = 0; i < length; i++) {
        data[i] = [i ,data[i]];
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
      }catch(e){
        if(combo.store.totalLength < 2){
          combo.disable();
        }
      }
    }
  });
  return combo;
}
function dateStartSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'Start Date',
    format:'Y-m-d',
    name:'startDate',
    selectOnFocus:true,
    startDay:1,
    value:''
  });
  date.on({
    'render':function(){
      try{
        var sDate = dataSelect.extra['startTime'];
        sDate = sDate.substring(0,10);
        date.setValue(sDate);
        delete dataSelect.extra['startTime'];
      }catch(e){}
    }
  });
  return date
}
function dateEndSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'End Date',
    format:'Y-m-d',
    name:'endDate',
    selectOnFocus:true,
    startDay:1,
    value:''
  });
  date.on({
    'render':function(){
      try{
        var sDate = dataSelect.extra['endTime'];
        sDate = sDate.substring(0,10);
        date.setValue(sDate);
        delete dataSelect.extra['endTime'];
      }catch(e){}
    }
  });
  return date
}
function displayWin(panel,title,modal,closeOnly,resize){
  if((modal == null) || (modal == '')){
    var modal = false;
  }else{
    var modal = true;
  }
  var maximizable = true;
  var collapsible = true;
  if(closeOnly == true){
    maximizable = false;
    collapsible = false;
  }
  var resizable = true;
  if(resize == false){
    resizable = false;
  }
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    width:600,
    height:350,
    border:true,
    collapsible:collapsible,
    constrain:true,
    constrainHeader:true,
    maximizable:maximizable,
    modal:modal,
    layout:'fit',
    plain:true,
    resizable:resizable,
    shim:false,
    title:title,
    items:[panel]
  });
  window.show();
  return window;
}
function initFileLookup(){
  function submitForm(){
    var sideBar = Ext.getCmp('sideBar');
    sideBar.body.mask('Sending data...');
    panel.form.submit({
      params:{byFile:'true'},
      success:function(form,action){
        sideBar.body.unmask();
        if(action.result.success == 'false'){
          alert('Error: ' + action.result.error);
        }else{
          var table = Ext.getCmp('DataMonitoringTable');
          if(table){
            try{
              table.store.loadData(action.result);
            }catch(e){
              alert('Error: ' + e.name + ': ' + e.message);
              return
             }
          }else{
            alert('Error: Unable to load data to the table dataMngr.store is absent');
          }
        }
      },
      failure:function(form,action){
        sideBar.body.unmask();
        alert('Error: ' + action.response.statusText);
      },
      url:'action'
    });
  }
}
function initProductionLookup(){
  function submitForm(){
    var table = Ext.getCmp('DataMonitoringTable');
    if(table){
      try{
        table.store.proxy.conn.url = 'action';
        var formValues = panel.form.getValues();
        table.store.baseParams = formValues;
        table.store.baseParams.byProd = 'true';
        table.store.baseParams.limit = table.bottomToolbar.pageSize;
        table.store.load();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
    }
  }
}
function createStateMatrix(msg){
  var result = [];
  if((msg == null) || (msg == '')){
    return;
  }
  var j = 0;
  for( i in msg){
    result[j] = [i,msg[i]]
    j++;
  }
  return result;
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
    }catch(e){
//      alert('+++')
//      alert(e)
    }
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
    id:'fileNumberPerPage',
    maxLength:4,
    maxLengthText:'The maximum value for this field is 1000',
    minLength:1,
    minLengthText:'The minimum value for this field is 1',
    mode:'local',
    name:'fileNumberPerPage',
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
              var bParams = '';
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
function hideControls(caller){
  if(caller){
    var value = caller.getRawValue();
    var sPanel = Ext.getCmp('selectPanel');
    if(sPanel){
      var items = sPanel.items;
      if(items){
        if(value == ''){
          for(var i = 0; i < items.length; i++){
            items.items[i].enable();
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
function pageRowNumber(ds,rowIndex){
  var i = 0;
  try{
    i = ds.lastOptions.params.start;
  }catch(e){}
  if(isNaN(i)){
    i = 0;
  }
  return rowIndex+i+1
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
function sortGlobalPanel(initButtonsArray,defaultSort,id,title){
  if((initButtonsArray == null) || (initButtonsArray == '')){
    alert('Error: Failed to initialize global sorting panel, buttons array is empty');
    return
  }
  if((id == null) || (id == '')){
    id = 'sortGlobalPanel';
  }
  if((title == null) || (title == '')){
    title = 'Global Sort';
  }
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
    var value = initButtonsArray;
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
    id:id,
    items:[p],
    labelAlign:'top',
    layout:'column',
    title:title
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
    }catch(e){}
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
function statPanelNew(title,id,columns,store,button){
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
  if((button != null) || (button != '')){
    panel.addButton(button);
  }
  return panel;
}
function statPanel(title,mode,id){
  var msg = [];
  if(mode == 'storage'){
    var reader = new Ext.data.ArrayReader({},[[
      {name:'SE'},
      {name:'Files'},
      {name:'Size'}
    ]]);
  }else{
    var reader = new Ext.data.ArrayReader({},[
      {name:'Status'},
      {name:'Number'}
    ]);
  }
  if(mode == 'text'){
    var columns = [
      {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
      {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
    ];
  }else if(mode == 'storage'){
    var columns = [
      {header:'SE',sortable:true,dataIndex:'SE',align:'left'},
      {header:'Replicas',width:50,sortable:true,dataIndex:'Files',align:'right'},
      {header:'Size',width:50,sortable:true,dataIndex:'Size',align:'left'}
    ];
  }else if((mode == 'fileStatus') || (mode == 'globalFile')){
    var columns = [
      {header:'',width:26,sortable:false,dataIndex:'Status',renderer:fileStatus,hideable:false}, 
      {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
      {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
    ];
  }else{
    var columns = [
      {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
      {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
      {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
    ];
  }
  if((mode == 'global') || (mode == 'globalFile')){
    var store = new Ext.data.Store({
      autoLoad:{params:{globalStat:'true'}},
      proxy: new Ext.data.HttpProxy({
        url:'action',
        method:'POST',
      }),
      reader:reader
    });
  }else if(mode == 'storage'){
    var store = new Ext.data.SimpleStore({
      fields:['SE','Files','Size'],
      data:msg
    });
    store.setDefaultSort('SE','ASC'); // Default sorting
  }else{
    var store = new Ext.data.SimpleStore({
      fields:['Status','Number'],
      data:msg
    });
  }
//  store.on('load',function(){
//    p.syncSize();
//  });
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
  if((mode == 'global') || (mode == 'globalFile')){
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
function basicID(name,fieldLabel,altRegex,altRegexText){
  var value = '';
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
  var textField = new Ext.form.TextField({
    anchor:'90%',
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
  return textField;
}
function genericID(name,fieldLabel,altRegex,altRegexText){
  textField = basicID(name,fieldLabel,altRegex,altRegexText); 
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
  return textField;
}
// Input fields
function selectFTSID(){
  return genericID('ftsid','ID');
}
function selectProduction(){
  return genericID('prod','Production');
}
function selectFileType(){
  return genericID('type','FileType');
}
function selectDirectory(){
  return genericID('dir','Directory');
}
function selectSEs(){
  var menu = createMenu('se','SEs');
  return menu
}
function selectDestinationsMenu(){
  var menu = createMenu('destination','Destination');
  return menu
}
function selectPartitionNamesMenu(){
  var menu = createMenu('partitionname','PartitionName');
  return menu
}
function selectStatesMenu(){
  var menu = createMenu('state','State');
  return menu
}
function selectFillIDMenu(){
  var menu = createMenu('fillid','FillID');
  return menu
}
function selectRunTypesMenu(){
  var menu = createMenu('runtype','RunType');
  return menu
}
function selectEndLumiMenu(){
  var menu = createMenu('endlumi','EndLumi');
  return menu
}
function selectStartLumiMenu(){
  var menu = createMenu('startlumi','StartLumi');
  return menu
}
function selectBeamEnergyMenu(){
  var menu = createMenu('beamenergy','BeamEnergy');
  return menu
}
function selectSourceSite(){
  var menu = createMenu('source','Source');
  return menu
}
function selectDestSite(){
  var menu = createMenu('destination','Destination');
  return menu
}
var regexLFN = new RegExp( /[^\0]+/);
function selectLFN(){
  var id = genericID('lfn','LFN',regexLFN,'Any non-NULL character');
  return id
}
function selectStorageElementMenu(){
  var menu = createMenu('storageelement','Storage Element');
  return menu
}
function selectRAWStatusMenu(){
  var menu = createMenu('status','Status');
  return menu
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
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    baseChars:'0123456789',
    enableKeyEvents:true,
    fieldLabel:'RunID',
    id:'selectID',
    mode:'local',
    name:'id',
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
function selectFileID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'File ID',
    enableKeyEvents:true,
    mode:'local',
    name:'fileID',
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
function selectJobID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'Job ID',
    enableKeyEvents:true,
    mode:'local',
    name:'jobID',
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
function selectRequestID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'Request ID',
    enableKeyEvents:true,
    mode:'local',
    name:'requestID',
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
function selectSubRequestID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'SubRequest ID',
    enableKeyEvents:true,
    mode:'local',
    name:'subRequestID',
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
// Lists:
function selectOperation(){
  if(dataSelect.operation){
    var data = dataSelect.operation;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['operation'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'operation',
    emptyText:data[0],
    fieldLabel:'Operation',
    forceSelection:true,
    hiddenName:'operation',
    mode:'local',
    name:'operation',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectRequestType(){
  if(dataSelect.type){
    var data = dataSelect.type;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['requestType'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'requestType',
    emptyText:data[0],
    fieldLabel:'RequestType',
    forceSelection:true,
    hiddenName:'requestType',
    mode:'local',
    name:'requestType',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectSourceSE(){
  if(dataSelect.source){
    data = dataSelect.source;
  }else{
    data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['sourceSE'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'sourceSE',
    emptyText:data[0],
    fieldLabel:'Source SE',
    forceSelection:true,
    hiddenName:'sourceSE',
    mode:'local',
    name:'sourceSE',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectStatusMenu(){
  if(dataSelect.stat){
    data = dataSelect.stat;
  }else{
    data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['stat'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'stat',
    emptyText:data[0],
    fieldLabel:'Status',
    forceSelection:true,
    hiddenName:'stat',
    mode:'local',
    name:'jobstat',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectTargetSE(){
  if(dataSelect.target){
    var data = dataSelect.target;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['targetSE'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'targetSE',
    emptyText:data[0],
    fieldLabel:'Target SE',
    forceSelection:true,
    hiddenName:'targetSE',
    mode:'local',
    name:'targetSE',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function showMenu(mode,table,rowIndex,columnIndex){
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get the name for the column
  var fieldName = table.getColumnModel().getDataIndex(columnIndex); // Get field name for the column
  dirac.menu = new Ext.menu.Menu(); // Nado li?
  var coords = Ext.EventObject.xy;
  if(record.data){
    selections = record.data;
    value = record.get(fieldName);
  }
  if(columnName != 'checkBox'){ // column with checkboxes
    dirac.menu.removeAll();
    if(mode == 'main'){
      setMenuItems(selections);
      if(dirac.menu.items.length > 0){
        dirac.menu.add('-',{handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
      }else{
        dirac.menu.add({handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
      }
    }else{
      dirac.menu.add({handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }
    dirac.menu.showAt(coords);
  }
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
    }else if(value == 'getLogInfoLFN'){
      titleValue = 'File: ';
    }else{
      titleValue = 'Item ID: ';
    }
  }
  title = titleValue + titleID;
  return title;
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
  if(tableMngr.plugins){
    var plugins = tableMngr.plugins;
  }else{
    var plugins = '';
  }
  var iNumber = itemsNumber();
  var pageSize = 25;
  try{
    pageSize = dataSelect.extra.limit/1; // Will be deleted in table function
  }catch(e){}
// Temp trik just to remove items per page in bk table
  var bk = false;
  try{
    if(tableMngr.bk == true){
      bk = true;
    }
  }catch(e){}
  if(bk == true){
    tableMngr.bbar = new Ext.PagingToolbar({
      displayInfo:true,
      pageSize:pageSize,
      refreshText:'Click to refresh current page',
      store:store
    });
  }else{
    tableMngr.bbar = new Ext.PagingToolbar({
      displayInfo:true,
      items:['-','Items displaying per page: ',iNumber,],
      pageSize:pageSize,
      refreshText:'Click to refresh current page',
      store:store
    });
  }
/*
  tableMngr.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber,],
    pageSize:pageSize,
    refreshText:'Click to refresh current page',
    store:store
  });
*/
  var tbar = new Ext.Toolbar({items:[]});
  if(tableMngr.tbar){
    tbar = new Ext.Toolbar({items:tableMngr.tbar});
  }
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
//    autoWidth:true,
    bbar:tableMngr.bbar,
    columns:columns,
    id:'DataMonitoringTable',
    labelAlign:'left',
    loadMask:true,
    margins:'2 0 2 0',
    region:'center',
    plugins:plugins,
    split:true,
    store:store,
    stripeRows:true,
    tbar:tbar,
    title:title,
    viewConfig:{forceFit:true}
  });
  if(tableMngr.tbar == ''){
    var bar = dataTable.getTopToolbar();
    bar.hide();
  }
  dataTable.on({
    'render':function(){
      try{
        delete dataSelect.extra.limit;
      }catch(e){}
    }
  });
  return dataTable;
}
function columnTreeee(){
  var tree = new Ext.tree.ColumnTree({
    rootVisible:false,
    autoScroll:true,
    margins:'2 0 2 0',
    region:'center',
    columns:[{
      header:'Site, CE',
      width:330,
      dataIndex:'PilotJobEff'
    },{
      header:'SubmissionEff',
      width:200,
      dataIndex:'SubmissionEff'
    },{
      header:'Aborted_Hour',
      width:200,
      dataIndex:'Aborted_Hour'
    }],
    loader: new Ext.tree.TreeLoader({
      baseAttrs:{},
      baseParams:{level:'/',node:'BKSource',root:'/'},
      dataUrl:'https://lhcbtest.pic.es/DIRAC/LHCb-Development/lhcb/data/BK/submit',
      uiProviders:{
        'col': Ext.tree.ColumnNodeUI
      }
    }),
    root: new Ext.tree.AsyncTreeNode({
      draggable:false,
      expanded:true,
      extra:'/',
      id:'BKSource',
      text: '/'
    })
  });
  return tree
}
function fileStatus(value){
  if((value == 'Done')||(value == 'Completed')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Failed')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Active')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }
}
function status(value){
  if((value == 'Done')||(value == 'Completed')||(value == 'Good')||(value == 'Active')||(value == 'IN BKK')||(value == 'ENDED')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Failed')||(value == 'Bad')||(value == 'Banned')||(value == 'UNKNOWN')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')||(value == 'Poor')){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/images/monitoring/deleted.gif">';
  }else if((value == 'Matched')||(value == 'CREATED')){
    return '<img src="'+gURLRoot+'/images/monitoring/matched.gif">';
  }else if((value == 'Running')||(value == 'Active')||(value == 'Fair')||(value == 'ACTIVE')||(value == 'MIGRATING')||(value == 'OPENED')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }else if((value == 'NoMask')||(value == 'NOT NEEDED')){
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
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
    var time = new Ext.form.TimeField({
      emptyText:'00:00',
      fieldLabel:fieldLabel,
      forceSelection:true,
      format:'H:i',
      increment:30,
      name:name,
      width:60
    });
    time.on({
      'render':function(){
        try{
          var sTime = dataSelect.extra[nameExtra];
          sTime = sTime.substring(11,16); // First 5 digits
          time.setValue(sTime);
          delete dataSelect.extra[nameExtra];
        }catch(e){}
      }
    });
    return time
  }
  var startDate = retDate('startDate','startDate','Start Date');
  var endDate = retDate('endDate','endDate','End Date');
  var startTime = retTime('startTime','startTime','Start Time');
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
    triggerAction:'all',
    typeAhead:true,
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
    'select':function(){
      var currentTime = new Date();
      var value = timeSpan.getValue();
      if(value == 'Last hour'){
        startTime.setValue(currentTime.add(Date.HOUR,-1));
        startDate.setValue(currentTime);
      }else if(value == 'Last day'){
        startTime.setValue(currentTime);
        startDate.setValue(currentTime.add(Date.DAY,-1));
      }else if(value == 'Last week'){
        startTime.setValue(currentTime);
        startDate.setValue(currentTime.add(Date.DAY,-7));
      }else if(value == 'Last month'){
        startTime.setValue(currentTime);
        startDate.setValue(currentTime.add(Date.MONTH,-1));
      }else if(value == 'Manual selection'){
        endTime.setValue(currentTime);
        endDate.setValue(currentTime);
      }else{
        alert('Unknown value: ',value);
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
    },
  });
  startDate.menuListeners.select = function(menu, date) {
    timeSpan.setValue('Manual selection');
    timeSpan.validate();
    startDate.setValue(date);
  };
  startDate.on({
    'KeyUp':function(){
      alert('XXX');
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
    bodyStyle:'padding: 5px',
    items:[
      {html:'Time Span:',colspan:2,bodyStyle:'border:0px'}
      ,timeSpan
      ,{html:'Start:',colspan:2,bodyStyle:'border:0px'}
      ,startDate
      ,startTime
      ,{html:'End: <b>Now</b>',colspan:2,bodyStyle:'border:0px'}
      ,endDate.disable()
      ,endTime.disable()
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
*/
