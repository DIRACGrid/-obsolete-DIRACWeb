var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initSiteSummary(reponseSelect){
  dataSelect = reponseSelect;
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'Site'},
    {name:'Grid'},
    {name:'Country'},
    {name:'MaskStatus'},
    {name:'Received',type:'int'},
    {name:'Checking',type:'int'},
    {name:'Staging',type:'int'},
    {name:'Waiting',type:'int'},
    {name:'Matched',type:'int'},
    {name:'Running',type:'int'},
    {name:'Stalled',type:'int'},
    {name:'Done',type:'int'},
    {name:'Completed',type:'int'},
    {name:'Failed',type:'int'},
    {name:'Efficiency'},
    {name:'Status'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var siteSelect = selectSiteMenu(); // Initializing Site Menu
  var ownerSelect = selectOwnerMenu(); // Initializing Owner Menu
  var appSelect = selectAppMenu(); // Initializing Application status Menu
  var statSelect = selectStatusMenu(); // Initializing JobStatus Menu
  var prodSelect = selectProdMenu(); // Initializing JobGroup Menu
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = selectID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  // Insert object to container BEFORE buttons:
  select.insert(0,siteSelect);
  select.insert(1,statSelect);
  select.insert(2,appSelect);
  select.insert(3,ownerSelect);
  select.insert(4,prodSelect);
  select.insert(5,dateSelect);
  select.insert(6,id);
//  select.collapsed = true;
  select.hide();
  return select
}
function initData(store){
  var columns = [
    {header:'Name',sortable:true,dataIndex:'Grid',align:'left'},
    {header:'Type',sortable:true,dataIndex:'Site',align:'left'},
    {header:'Country',sortable:true,dataIndex:'Country',align:'left'},
    {header:'MaskStatus',sortable:true,dataIndex:'MaskStatus',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'Waiting',align:'left'},
    {header:'Running',sortable:true,dataIndex:'Running',align:'left'},
    {header:'Done',sortable:true,dataIndex:'Done',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'Failed',align:'left'},
    {header:'Stalled',sortable:true,dataIndex:'Stalled',align:'left'},
    {header:'Received',sortable:true,dataIndex:'Received',align:'left'},
    {header:'Checking',sortable:true,dataIndex:'Checking',align:'left'},
    {header:'Staging',sortable:true,dataIndex:'Staging',align:'left'},
    {header:'Matched',sortable:true,dataIndex:'Matched',align:'left'},
    {header:'Completed',sortable:true,dataIndex:'Completed',align:'left'},
    {header:'Efficiency',sortable:true,dataIndex:'Efficiency',align:'left'},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'}
  ];
  var title = 'Site Summary';
  dirac.tbar = ['->',
    {handler:function(){store.load()},text:'Refresh it',tooltip:'Click to refresh the data'}
  ];
//  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':dirac.tbar};
//  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':''};
  store.setDefaultSort('Grid','ASC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':dirac.tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('main',table,rowIndex,columnIndex);
  });
  t.footer = false;
  return t
}
function setMenuItems(selections){
  if(selections){
    var id = selections.name;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('site',id)},text:'Show Job(s)'}
    );
  }
};
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store}
}
function afterDataLoad(store){
  try{
    var img = '<img src="getImg?name="'+store.reader.jsonData.plots+'>';
  }catch(e){}
  var last = 'Refresh it';
  if(store){
    if(store.reader){
      if(store.reader.jsonData){
        last = dataMngr.store.reader.jsonData.time;
      }
    }
  }
  last = 'Last update: ' + last
  if(dirac){
    if(dirac.tbar){
      if(dirac.tbar.items){
        if(dirac.tbar.items.items[1]){
          dirac.tbar.items.items[1].setText(last);
        }
      }
    }
  }
}
function jump(type,id){
  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup
  url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
//  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
  post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
  post_req = post_req + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
}
