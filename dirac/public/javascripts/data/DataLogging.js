var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initDataLogging(){
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'Status'},
    {name:'MinorStatus'},
    {name:'StatusTime'},
    {name:'Source'}
  ]);
  return record
}
function initData(store){
  var columns = [
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'MinorStatus',sortable:true,dataIndex:'MinorStatus',align:'left'},
    {header:'StatusTime [UTC]',sortable:true,dataIndex:'StatusTime',align:'left'},
    {header:'Source',sortable:true,dataIndex:'Source',align:'left'}
  ];
  var title = 'DataLogging Monitor';
  var lfnAddress = new Ext.form.ComboBox({
    anchor:'90%',
    emptyText:'Type LFN here',
    enableKeyEvents :true,
    fieldLabel:'LFN',
    hiddenName:'lfnAddress',
    hideOnSelect:false,
    id:'lfnAddress',
    mode:'local',
    resizable:true,
    store:['x','y','z'],
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  }); 
  var tbar = [

{
    anchor:'90%',
    xtype:'textfield',
    fieldLabel:'LFN',
    id:'lfnField',
    name:'lfnField',
    width:1000
  },{

//    lfnAddress,{
    cls:"x-btn-text-icon",
    handler:function(){submitLFN()},
    icon:gURLRoot+'/images/iface/checked.gif',
    text:'Submit',
    tooltip:'Click to showlogging information for given LFN'
  }];
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':tbar};
  var t = table(tableMngr);
  var bbar = t.getBottomToolbar();
  bbar.disable();
  bbar.hide();

  lfnAddress.on({
//    'specialkey':function(e,keyz){
    'keyup':function(e,keyz){
      var ttttttt = keyz.getKey();
      var ddd = 0 ;
    }
  })

//Ext.getCmp('header_user_cbstatus').addListener('keyup', PersonalMessageStatusSpecialKeyEntered);
/*
  new Ext.KeyMap(Ext.getCmp('lfnAddress'),{
    key:Ext.EventObject.ENTER,
    fn:function(e){
      alert("ctrl+g");
    },
    stopEvent:true
  });
*/
  return t
}
function renderData(store){
  var mainContent = initData(store);
  renderInMainViewport([ mainContent ]);
}
function submitLFN(){
  try{
    var lfnField = Ext.getCmp('lfnField');
    lfn = lfnField.getValue()
    if(lfn == ''){
      alert('Error: LFN field is empty');
      return
    }else{
      var table = Ext.getCmp('DataMonitoringTable');
      table.store.load({params:{'lfn':lfn}});
    }
  }catch(e){}
}
function afterDataLoad(){
}
