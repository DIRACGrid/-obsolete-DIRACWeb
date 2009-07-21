/*
 * Production Requests JS
 *
 * AZ, PI 2009
 *
 * It needs the following extentions:
 *       examples/grid/RowExpander.js
 *       TreeGrid
 *
 * ProdRequests.css must be loaded as well
 */

Ext.ns('PR');

/*
 * Add working show/hide to Ext.form.Field.
 * Based on: http://extjs.com/forum/showthread.php?t=17396 (webpaul)
 * AZ: since it likely to appear in next ExtJS version,
 *     and it will be implemented quite differently,
 *     I don't want override it... 
 */

PR.showField = function(field){
  field.enable();
  field.show();
  field.getEl().up('.x-form-item').setDisplayed(true);
}

PR.hideField = function(field){
  field.disable();
  field.hide();
  field.getEl().up('.x-form-item').setDisplayed(false);
}

/*
 * Used by setReadOnly in case it was called before render...
 */
PR.__readOnlyAfterRender = function(field) {
  field.getEl().dom.readOnly = field.readOnly;
  if(field.trigger)
    field.trigger.setDisplayed(!field.readOnly);
}

/*
 * Readonly. Derived from example of Murray Hopkins (www.murrah.com.au)
 *
 * ro (Bool): editable(False)/readonly(True)
 */
PR.setReadOnly = function(field,ro){
  var cls = 'x-item-readonly';
  
  /*
  field.getEl().dom.setAttribute('readOnly',false);
  */

  if(ro)
    field.addClass(cls);
  else
    field.removeClass(cls);

  field.readOnly = ro;
  if(field.rendered)
    PR.__readOnlyAfterRender(field);
  else
    field.on('render',PR.__readOnlyAfterRender);

  // The following is untested
  var xType = field.getXType();

  if(xType=='combo')
    field.expand = field.expand.createInterceptor(function(){
      return !field.readOnly;      
    }); 
  if(xType=='radiogroup' || xType=='checkboxgroup'){
    var items = field.items.items;
    for(var i=0;i<items.lenght; ++i)
      items[i].readOnly = ro;
  }
}

/*
 * Due to bug in dynamic forms, I have to search
 * some fields in containers directlye
 */
PR.getField = function(container,name) {
  return container.find('name',name)[0];
}

/*
 * Fix emptyText "Feature"...
 * from http://extjs.com/forum/showthread.php?t=8029&page=2 (sebsei)
 */
Ext.form.Action.Submit.prototype.run = Ext.form.Action.Submit.prototype.run.createInterceptor(function() {
  this.form.items.each(function(item) {
    if (item.el.getValue() == item.emptyText) {
      item.el.dom.value = '';
    }
    });
 });
Ext.form.Action.Submit.prototype.run = Ext.form.Action.Submit.prototype.run.createSequence(function() {
  this.form.items.each(function(item) {
    if (item.el.getValue() == '' && item.emptyText) {
      item.el.dom.value = item.emptyText;
    }
    });
 });

/*
 * DIRACify Ext.decode when not yet done
 *
 * This trick (hack?) add 'success' property to decode
 * result in case it is not yet exist and 'OK' property
 * exist. That makes default AJAX form handling happy
 * with DIRAC S_XX().
 */

if(typeof Ext.decode('{"Value": "", "OK": true}').success == "undefined"){
  Ext.decode = function(json){
    var result = Ext.util.JSON.decode(json);
    if(typeof result.OK != "undefined")
      result.success = result.OK;
    return result;
  }
}


/**
 * PR.RequestDetail
 * @extends Ext.Panel
 * Specialized Panel to show information about
 * a request.
 *
 * Markup version
 */
PR.RequestDetail = Ext.extend(Ext.Panel, {
  tplSimMarkup: [
    '<b>ID:</b> {ID}<br/>',
    '<b>Name:</b> {reqName}<br/>',
    '<b>Type:</b> {reqType}<br/>',
    '<b>State:</b> {reqState}<br/>',
    '<b>Priority:</b> {reqPrio}<br/>',
    '<b>Author:</b> {reqAuthor}<br/>',

    '<b>Event type:</b> {eventType}<br/>',
    '<b>Number of events:</b> {eventNumber}<br/><br>',

    '<b>Simulation Conditions:</b> {simDesc}<br/>',
    '<b>Beam:</b> {BeamCond} ',
    '<b>Beam energy:</b> {BeamEnergy} ',
    '<b>Generator:</b> {Generator}<br/>',
    '<b>Magnetic field:</b> {MagneticField} ',
    '<b>Detector:</b> {DetectorCond} ',
    '<b>Luminosity:</b> {Luminosity}<br/><br/>',
    '<b>Processing Pass:</b> {pDsc}<br/>',
    '{p1Html}{p2Html}{p3Html}{p4Html}',
    '{p5Html}{p6Html}{p7Html}<br/>',

    '<b>Comments</b><br/> {htmlReqComment}<br/>'
  ],

  tplRunMarkup: [
    '<b>ID:</b> {ID}<br/>',
    '<b>Name:</b> {reqName}<br/>',
    '<b>Type:</b> {reqType}<br/>',
    '<b>State:</b> {reqState}<br/>',
    '<b>Priority:</b> {reqPrio}<br/>',
    '<b>Author:</b> {reqAuthor}<br/>',

    '<b>Event type:</b> {eventType}<br/>',
    '<b>Number of events:</b> {eventNumber}<br/><br>',

    '<b>Configuration:</b> {configName} <b>version:</b> {configVersion}<br>',
    '<b>Conditions:</b> {simDesc} <b>type:</b> {condType}<br/>',
    '<b>Processing pass:</b> {inProPass}<br/>',
    '<b>Input file type:</b> {inFileType}<br/>',
    '<b>DQ flag:</b> {inDataQualityFlag}<br/>',
    '<b>Input production:</b> {inProductionID}<br/><br/>',

    '<b>Processing Pass:</b> {pDsc}<br/>',
    '{p1Html}{p2Html}{p3Html}{p4Html}',
    '{p5Html}{p6Html}{p7Html}<br/>',

    '<b>Comments</b><br/> {htmlReqComment}<br/>'
  ],

  initComponent: function() {
    this.tplSim = new Ext.Template(this.tplSimMarkup);
    this.tplRun = new Ext.Template(this.tplRunMarkup);
    PR.RequestDetail.superclass.initComponent.call(this);
  },

  updateDetail: function(data) {
    var com = data.reqComment;
    var eol = /\n/g;
    var lt = /</g;
    var gt = />/g;
    data.htmlReqComment = data.reqComment.replace(eol,'<br/>');
    if(data.reqType == 'Simulation')
      this.tplSim.overwrite(this.body,data);
    else
      this.tplRun.overwrite(this.body,data);
  },

  onDataChanged: function(store) {
    if(this.IDs){
      for(var i=0;i<this.IDs.length;++i){
	var nr = store.getById(this.IDs[this.IDs.length-1-i]);
	if(!nr){
//!!!	  alert(this.IDs[this.IDs.length-1-i])
	  return;
	}
	if(!r)
	  r = nr.copy();
	else {
	  if(nr.data.eventType)
	    r.set('eventType',nr.data.eventType);
	  if(nr.data.eventNumber)
	    r.set('eventNumber',nr.data.eventNumber);
	  if(nr.data.reqComment)
	    r.set('reqComment',r.data.reqComment + '\n' + nr.data.reqComment);
	}
      }
    } else { 
      if(typeof this.ID == 'undefined')
	return;
      var idx = store.find('ID',this.ID);
      if(idx >= 0 )
	var r = store.getAt(idx);
    }
    if(typeof r != 'undefined')
      this.updateDetail(r.data);
  }
});
Ext.reg('prdetail', PR.RequestDetail);

/**
 * PR.TreeLoader
 * @extends Ext.tree.TreeLoader
 * Parse DIRAC style responces
 */
PR.TreeLoader = Ext.extend(Ext.tree.TreeLoader, {
  processResponse : function(response, node, callback){
    var json = response.responseText;
    try {
      var o = eval("("+json+")");
      if(!o.OK)
	throw("Not ok");
      o = o.Value;
      node.beginUpdate();
      for(var i = 0, len = o.length; i < len; i++){
	var n = this.createNode(o[i]);
	if(n){
	  node.appendChild(n);
	}
      }
      node.endUpdate();
      if(typeof callback == "function"){
	callback(this, node);
      }
    }catch(e){
      this.handleFailure(response);
    }
  }
});

/**
 * PR.SimCondDetail
 * @extends Ext.Panel
 * Specialized Panel to show information about
 * simulation conditions.
 *
 * Markup version
 */
PR.SimCondDetail = Ext.extend(Ext.Panel, {
  tplMarkup: [
    '<b>ID:</b> {simCondID}<br/>',
    '<b>Description:</b> {simDesc}<br/>',
    '<b>Beam:</b> {BeamCond}<br/>',
    '<b>Beam energy:</b> {BeamEnergy}<br/>',
    '<b>Generator:</b> {Generator}<br/>',
    '<b>Magnetic field:</b> {MagneticField}<br/>',
    '<b>Detector:</b> {DetectorCond}<br/>',
    '<b>Luminosity:</b> {Luminosity}<br/>'
  ],

  initComponent: function() {
    this.tpl = new Ext.Template(this.tplMarkup);
    this.data = {};
    PR.SimCondDetail.superclass.initComponent.call(this);
  },

  updateDetail: function(data) {
    this.data = data;
    this.tpl.overwrite(this.body, this.data);
  }
});

/**
 * PR.BkSimCondLoader
 * @extend PR.TreeLoader
 * Load tree to select Simulation Conditions from BK
 */
PR.BkSimCondLoader = function(config) {
  var config = config || {};
  Ext.apply(config, {dataUrl:'bkk_tree'});
  PR.BkSimCondLoader.superclass.constructor.call(this,config);
  this.on("beforeload", function(loader,node) {
    if(node.attributes.configName)
      this.baseParams.configName = node.attributes.configName;
    else
      delete this.baseParams.configName
    if(node.attributes.configVersion)
      this.baseParams.configVersion = node.attributes.configVersion;
    else
      delete this.baseParams.configVersion
  }, this);
  this.on("loadexception",loadBugger("SimCond Loader"));
}
Ext.extend(PR.BkSimCondLoader,PR.TreeLoader);

/**
 * PR.BkAllSimCondStore
 * @extends Ext.data.JsonStore
 * That is a specialized Store for registered Simulation Conditions
 *
 * Portal based version.
 */
PR.BkAllSimCondStore = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'bkk_simcond',
    root:       'result',
    totalProperty: 'total',
    remoteSort: true,
    fields: [
      'simCondID',
      'simDesc',
      'BeamCond',
      'BeamEnergy',
      'Generator',
      'MagneticField',
      'DetectorCond',
      'Luminosity'
    ],
    listeners : { 
      'loadexception' : { 
	fn: storeBugger('list of Simulation Conditions'), 
	scope: this
      }
    }
  });
  PR.BkAllSimCondStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.BkAllSimCondStore,Ext.data.JsonStore);


/**
 * PR.BkAllSimCond
 * @extends Ext.grid.GridPanel
 * This is a custom grid to display all registered
 * Simulation Conditions from bookkeeping
 */
PR.BkAllSimCond = Ext.extend(Ext.grid.GridPanel, {
  // override
  initComponent: function() {
    var store = new PR.BkAllSimCondStore();

    var pagingBar = new Ext.PagingToolbar({
      pageSize:    150,
      store:       store,
      displayInfo: true,
      displayMsg:  'Displaying {0} - {1} of {2}',
      emptyMsg:    'No conditions are registered',
    });

    store.setDefaultSort('simDesc', 'ASC');
    store.load({params: {start:0, limit:pagingBar.pageSize}});

    Ext.apply(this, {
      columns: [
	{header:'Description',sortable:true, dataIndex:'simDesc'}
      ],
      autoHeight:    false,
      autoWidth:     true,
      loadMask:      true,
      region:        'center',
      store:         store,
      sm:            new Ext.grid.RowSelectionModel({singleSelect: true}),
      stripeRows:    true,
      viewConfig:    {forceFit:true},
      bbar:          pagingBar
    });
    PR.BkAllSimCond.superclass.initComponent.call(this);
  }
});


/**
 * PR.BkSimCondBrowser
 * @extends Ext.Window
 * Simulation condition browser (from BK)
 */
PR.BkSimCondBrowser = Ext.extend(Ext.Window, {
  initComponent : function() {
    var tree = new Ext.tree.TreePanel({
      autoScroll:true,
      title: "Used",

      animate:true,
      rootVisible: false,

      loader: new PR.BkSimCondLoader(),

      root: new Ext.tree.AsyncTreeNode({text: 'Bookkeeping', id: '/'})
    });
    new Ext.tree.TreeSorter(tree, {folderSort:true});
    tree.on('click', this.onTreeClicked, this);

    var list = new PR.BkAllSimCond({title: 'All'});
    list.getSelectionModel().on('rowselect', this.onListSelect, this);

    this.detail = new PR.SimCondDetail({
      region: 'east',
      split: true,
      width: 350,
      minWidth: 200,
      margins: '5 5 5 0',
      
      title: 'Condition details',
      bodyStyle: 'padding-left:15px; padding-top:5px',

      html: '<p>Plese select Simulation Condition on the left side</p>',

      buttonAlign: 'center',
      buttons: [
	{text: 'Select', id: 'sim-cond-select', disabled: true },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });
    // detail.on('render',function() { this.updateDetail({}); }, detail);

    Ext.apply(this, {
      title: 'Simulation conditions browser',
      width: 750,
      height: 350,
      minWidth: 500,
      minHeight: 300,
      maximizable: true,
      modal: true,
      layout: 'border',
      items: [{
	xtype: 'tabpanel',
	region: 'center',
	split: true,
	margins: '5 0 5 5',
	minWidth: 300,
	
	activeTab: 0,
	items: [ list, tree ] 
      }, this.detail ]
    });
    PR.BkSimCondBrowser.superclass.initComponent.call(this);
  },
  onTreeClicked: function(n) {
    if(!n.leaf)
      return;
    this.detail.updateDetail(n.attributes);
    Ext.getCmp('sim-cond-select').enable();
  },
  onListSelect: function(sm, row, rec) {
    this.detail.updateDetail(rec.data);
    Ext.getCmp('sim-cond-select').enable();
  }
});


/**
 * PR.InDataDetail
 * @extends Ext.Panel
 * Specialized Panel to show information about
 * input data.
 *
 * Markup version
 */
PR.InDataDetail = Ext.extend(Ext.Panel, {
  tplSimMarkup: [
    '<b>Simulation conditions:</b> {simDesc}<br/>',
    '<b>Beam:</b> {BeamCond}<br/>',
    '<b>Beam energy:</b> {BeamEnergy}<br/>',
    '<b>Generator:</b> {Generator}<br/>',
    '<b>Magnetic field:</b> {MagneticField}<br/>',
    '<b>Detector:</b> {DetectorCond}<br/>',
    '<b>Luminosity:</b> {Luminosity}<br/>',
    '<br/><b>Process Pass:</b> {inProPass}<br/>',
    '<br/><b>Event type:</b> {evType}<br/>',
    '<br/><b>File type:</b> {inFileType}<br/>'
  ],

  tplRunMarkup: [
    '<b>Run conditions:</b> {simDesc}<br/>',
    '<b>Beam:</b> {BeamCond}<br/>',
    '<b>Beam energy:</b> {BeamEnergy}<br/>',
    '<b>Magnetic field:</b> {MagneticField}<br/>',
    '<b>Subdetectors:</b> {DetectorCond}<br/>',
    '<br/><b>Process Pass:</b> {inProPass}<br/>',
    '<br/><b>Event type:</b> {evType}<br/>',
    '<br/><b>File type:</b> {inFileType}<br/>'
  ],

  initComponent: function() {
    this.sim_tpl = new Ext.Template(this.tplSimMarkup);
    this.run_tpl = new Ext.Template(this.tplRunMarkup);
    this.data = {};
    PR.InDataDetail.superclass.initComponent.call(this);
  },

  updateDetail: function(data) {
    this.data = data;
    if(data.condType == 'Run')
      this.run_tpl.overwrite(this.body, this.data);
    else
      this.sim_tpl.overwrite(this.body, this.data);
  }
});

/**
 * PR.BkInDataLoader
 * @extend PR.TreeLoader
 * Load tree to select InputData from BK
 */
PR.BkInDataLoader = function(config) {
  var config = config || {};
  Ext.apply(config, {dataUrl:'bkk_input_tree'});
  PR.BkInDataLoader.superclass.constructor.call(this,config);
  this.on("beforeload", function(loader,node) {
    if(node.attributes.configName)
      this.baseParams.configName = node.attributes.configName;
    else
      delete this.baseParams.configName
    if(node.attributes.configVersion)
      this.baseParams.configVersion = node.attributes.configVersion;
    else
      delete this.baseParams.configVersion
    if(node.attributes.simCondID)
      this.baseParams.simCondID = node.attributes.simCondID;
    else
      delete this.baseParams.simCondID
    if(node.attributes.condType)
      this.baseParams.condType = node.attributes.condType;
    else
      delete this.baseParams.condType
    if(node.attributes.inProPass)
      this.baseParams.inProPass = node.attributes.inProPass;
    else
      delete this.baseParams.inProPass
    if(node.attributes.evType)
      this.baseParams.evType = node.attributes.evType;
    else
      delete this.baseParams.evType
  }, this);
  this.on("loadexception",loadBugger("InData Loader"));
}
Ext.extend(PR.BkInDataLoader,PR.TreeLoader);

/**
 * PR.BkInDataBrowser
 * @extends Ext.Window
 * Input data browser (from BK)
 */
PR.BkInDataBrowser = Ext.extend(Ext.Window, {
  initComponent : function() {
    var tree = new Ext.tree.TreePanel({
      autoScroll:true,
      title: "Input data",

      animate:true,
      rootVisible: false,

      loader: new PR.BkInDataLoader(),

      root: new Ext.tree.AsyncTreeNode({text: 'Bookkeeping', id: '/'})
    });
    new Ext.tree.TreeSorter(tree, {folderSort:true});
    tree.on('click', this.onTreeClicked, this);

    this.detail = new PR.InDataDetail({
      region: 'east',
      split: true,
      width: 350,
      minWidth: 200,
      margins: '5 5 5 0',
      
      title: 'Details',
      bodyStyle: 'padding-left:15px; padding-top:5px',

      html: '<p>Plese select Input Data on the left side</p>',

      buttonAlign: 'center',
      buttons: [
	{text: 'Select', id: 'in-data-select', disabled: true },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });

    Ext.apply(this, {
      title: 'Input data browser',
      width: 750,
      height: 350,
      minWidth: 500,
      minHeight: 300,
      maximizable: true,
      modal: true,
      layout: 'border',
      items: [{
	xtype: 'tabpanel',
	region: 'center',
	split: true,
	margins: '5 0 5 5',
	minWidth: 300,
	
	activeTab: 0,
	items: [ tree ] 
      }, this.detail ]
    });
    PR.BkInDataBrowser.superclass.initComponent.call(this);
  },
  onTreeClicked: function(n) {
    if(!n.leaf)
      return;
    this.detail.updateDetail(n.attributes);
    Ext.getCmp('in-data-select').enable();
  }
});

/**
 * PR.SubRequestAdder
 * @extends Ext.Window
 * Add multiple subrequests at once
 */
PR.SubRequestAdder = Ext.extend(Ext.Window, {
  initComponent : function() {
    this.master = new PR.RequestDetail({ID: this.data.ID, 
					minWidth: 200, region: 'center', frame:true,
					title: 'Master request', autoScroll:true});
    this.master.on('render',function() { this.master.updateDetail(this.data); }, this);

    var store = new Ext.data.SimpleStore({
      fields: [ {name: 'eventType'}, {name: 'eventNumber', type: 'int'} ],
      data: []
    });
    store.on('datachanged',this.onStoreChanged,this);

    this.subrq = new Ext.grid.GridPanel({
      region: 'center',
      frame: true,
      margins: '0 0 5 0',
      store: store,
      columns: [
	{header:'Event type', dataIndex:'eventType'},
	{header:'Events requested', dataIndex:'eventNumber'}
      ],
      stripeRows: true,
      title:'Subrequests to create',
      autoHeight:    false,
      autoWidth:     true,
      sm:            new Ext.grid.RowSelectionModel({singleSelect: true}),
      viewConfig:    {forceFit:true}
    });
    this.menu = new Ext.menu.Menu();
    this.menu.add( 
      {handler: function() {
	var r = this.subrq.getSelectionModel().getSelected();
	this.subrq.store.remove(r);
	this.onStoreChanged(this.subrq.store);
      },scope: this,text: 'Remove' }
    );

    this.subrq.on('rowclick',this.onRowClick, this);

    var eventStore = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'bkk_event_types?addempty'}),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'id'},{name: 'text'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of Event Types'), scope: this
	}
      }
    });
    eventStore.load({callback: this.onEventTypesLoaded, scope: this});


    this.addev = new Ext.Button();

    this.evset = new Ext.form.FieldSet({
      region: 'south',
      title: 'Select event type to add as subrequest',
      autoHeight: true, width: 622,
      items: [
	{ xtype: 'combo', fieldLabel: 'Type', hiddenName: 'eventType',
	  store: eventStore, displayField: 'text', valueField: 'id',
	  forceSelection: true, mode: 'local',
	  triggerAction: 'all', selectOnFocus: true, 
	  emptyText: 'Select event type',
	  autoCreate: {
	    tag: "input", type: "text", size: "60", autocomplete: "off"
	  },
	  listeners : {
	    'select' : { fn: this.onEventTypeSelect, scope: this }
	  }
	},
	{ xtype: 'panel',
	  layout: 'column',
	  border: false,
	  items: [{
	    width: 300,
	    layout: 'form',
	    autoHeight: true,
	    items: {
	      xtype: 'numberfield', fieldLabel: 'Number', name: 'eventNumber',
	      anchor: '100%'
	    }
	  },{
	    width: 60,
	    bodyStyle: 'padding-left: 5px;',
	    items: {xtype: 'button',text: 'Add',handler: this.onAdd, scope: this}
	  }]
	}	      
      ]
    });
    
    this.east = new Ext.Panel({
      region: 'east',
      split: true,
      width: 600,
      minWidth: 600,
      border: false,

      layout: 'border',
      items: [ this.subrq, this.evset ],

      buttonAlign: 'center',
      buttons: [
	{text: 'Create', disabled: true, id: 'srq-create-btn', 
	 handler: this.onCreate, scope: this },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });

    this.form = new Ext.FormPanel({
      border: false,
      items: {
	xtype:  'panel',
	layout: 'border',
	frame: true,
	border: false,
	anchor: '100% 100%',
	items: [ this.master, this.east ]
      }
    });

    Ext.apply(this, {
      width: 950,
      height: 350,
      minWidth: 500,
      minHeight: 300,
      maximizable: true,
      modal: true,
      layout: 'fit',
      items: this.form
    });
    PR.SubRequestAdder.superclass.initComponent.call(this);
  },
  initEvents: function() {
    PR.SubRequestAdder.superclass.initEvents.call(this);
    this.addEvents( 'saved' );
  },
  onEventTypeSelect: function(combo,record,index) {
    if(combo.getValue() == 99999999)
      combo.setValue('');
  },
  onAdd : function(){
    var form = this.form.getForm();
    evtype  = form.findField('eventType').getValue();
    evnumber = form.findField('eventNumber').getValue();
    if(!evtype || !evnumber){
      Ext.Msg.alert('Please specify information',
		    'Both event type and number must be specified');
      return;
    }
    this.subrq.store.add(new this.subrq.store.recordType({
      eventType: evtype, eventNumber: evnumber
    }));
    this.onStoreChanged(this.subrq.store);
  },
  onStoreChanged: function(store){
    var btn = Ext.getCmp('srq-create-btn');
    if(store.getCount())
      btn.enable();
    else
      btn.disable();
  },
  onRowClick: function(grid, rowIdx, e) {
    this.menu.showAt(Ext.EventObject.xy);
  },
  onCreate: function() {
    var store = this.subrq.store;
    for(var i=0;i<store.getCount();++i){
      var r=store.getAt(i);
      this.saveOne(r.data.eventType,r.data.eventNumber);
    }
    this.fireEvent('saved',this);
    this.close();
  },
  saveOne: function(evtype,evnumber) {
    if(!evtype || !evnumber){
      Ext.MessageBox.show({
	title: 'Incomplete subrequest',
	msg: "You have to specify event type and number. ",
	buttons: Ext.MessageBox.OK,
	icon: Ext.MessageBox.ERROR
      });
      return;
    }
    var pdict = {
      _master: this.data.ID,
      _parent: this.data.ID,
      eventType: evtype,
      eventNumber: evnumber
    };
    var conn = new Ext.data.Connection();
    conn.request({
      url: 'save',
      method: 'POST',
      params: pdict,
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Subrequest create failed',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
      },
      failure: connectBugger('Subrequest create')
    });
  }
});


/**
 * PR.TemplateStore
 * @extends Ext.data.JsonStore
 * That is a specialized Store for Production Templates
 *
 * Portal based version.
 */
PR.TemplateStore = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'templates',
    root:       'result',
    remoteSort: false,
    fields: [
      "AuthorGroup",
      "Author",
      "PublishingTime",
      "LongDescription", 
      "WFName",
      "AuthorDN",
      "WFParent",
      "Description"
    ],
    listeners : { 
      'loadexception' : { 
	fn: storeBugger('list of Production Templates'), 
	scope: this
      }
    }
  });
  PR.TemplateStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.TemplateStore,Ext.data.JsonStore);


/**
 * PR.TemplateList
 * @extends Ext.grid.GridPanel
 * This is a custom grid to display the list of Templates
 */
PR.TemplateList = Ext.extend(Ext.grid.GridPanel, {
  // override
  initComponent: function() {
    var store = new PR.TemplateStore();
    store.load();

    Ext.apply(this, {
      columns: [
	{header:'Template',sortable:true, dataIndex:'WFName'}
      ],
      autoHeight:    false,
      autoWidth:     true,
      loadMask:      true,

      store:         store,
      sm:            new Ext.grid.RowSelectionModel({singleSelect: true}),
      stripeRows:    true,
      viewConfig:    {forceFit:true},
    });
    PR.TemplateList.superclass.initComponent.call(this);
  }
});

/**
 * PR.TemplateDetail
 * @extends Ext.Panel
 * Specialized Panel to show information about
 * template.
 *
 * Markup version
 */
PR.TemplateDetail = Ext.extend(Ext.Panel, {
  tplMarkup: [
    '<b>Name:</b> {WFName}<br/>',
    '<b>Short description:</b> {Description}<br/>',
    '<b>Author:</b> {Author}<br/>',
    '<b>Last modified:</b> {PublishingTime}<br/>',
    '<b>Description:</b> {LongDescription}<br/>'
  ],

  initComponent: function() {
    this.tpl = new Ext.Template(this.tplMarkup);
    this.data = {};
    PR.TemplateDetail.superclass.initComponent.call(this);
  },

  updateDetail: function(data) {
    this.data = data;
    this.tpl.overwrite(this.body, this.data);
  }
});

/**
 * PR.SubrequestStore
 * @extends Ext.data.JsonStore
 * That is a specialized Store for Subrequests (without TreeGrid)
 *
 * Portal based version.
 */
PR.SubrequestStore = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'list',
    root:       'result',
    id:         'ID',
    remoteSort: false,
    fields: [
      {name:'ID', type: 'auto'},
      {name:'eventType'},
      {name:'eventNumber'},
      {name:'eventBK'},
      {name:'progress'},
    ],
    listeners : { 
      'loadexception' : { 
	fn: storeBugger('list of Subrequests'), 
	scope: this
      }
    }
  });
  PR.SubrequestStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.SubrequestStore,Ext.data.JsonStore);


/**
 * PR.SubrequestList
 * @extends Ext.grid.GridPanel
 * This is a custom grid to display the list of subrequests
 */
PR.SubrequestList = Ext.extend(Ext.grid.GridPanel, {
  // override
  initComponent: function() {
    store = new PR.SubrequestStore();
    sm = new Ext.grid.CheckboxSelectionModel();
    Ext.apply(this, {
      columns: [
	sm,
	{id: 'Id', header:'Id', sortable:true, dataIndex:'ID', width:40},
	{header:'Event type', sortable:true, dataIndex:'eventType' },
	{header:'Events requested', sortable:true,dataIndex:'eventNumber' },
	{header:'Events in BK', dataIndex:'eventBK' },
	{header:'Progress (%)', dataIndex:'progress' }
      ],
      autoHeight:    false,
      autoWidth:     true,
      loadMask:      true,

      store:         store,
      sm:            sm,          
      stripeRows:    true,
      viewConfig:    {forceFit:true},
    });
    store.setDefaultSort('ID', 'ASC');
    PR.SubrequestList.superclass.initComponent.call(this);
  }
});

/**
 * PR.TemplateParStore
 * @extends Ext.data.JsonStore
 * That is a specialized Store for Template parameters
 *
 * Portal based version.
 */
PR.TemplateParStore = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'template_parlist',
    root:       'result',
    remoteSort: false,
    fields: [
      "par",
      "label",
      "value"
    ],
    listeners : { 
      'loadexception' : { 
	fn: storeBugger('list of Template parameters'), 
	scope: this
      }
    }
  });
  PR.TemplateParStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.TemplateParStore,Ext.data.JsonStore);

/**
 * PR.TemplateParList
 * @extends Ext.grid.EditorGridPanel
 * This is a custom grid to display and edit the list of Template Parameters
 */
PR.TemplateParList = Ext.extend(Ext.grid.EditorGridPanel, {
  // override
  initComponent: function() {
    store = new PR.TemplateParStore();
    Ext.apply(this, {
      columns: [
	{header:'Parameter', sortable:true, dataIndex:'label'},
	{header:'Value', sortable:false, dataIndex:'value', 
	 editor: new Ext.form.TextField() }
      ],
      autoHeight:    false,
      autoWidth:     true,
      loadMask:      true,

      store:         store,
      stripeRows:    true,
      clicksToEdit:  1,
      viewConfig:    {forceFit:true},
    });
    store.setDefaultSort('label', 'ASC');
    PR.SubrequestList.superclass.initComponent.call(this);
  }
});


/**
 * PR.PrWorkflow
 * @extends Ext.Window
 * Generate a workflow from template and request
 */
PR.PrWorkflow = Ext.extend(Ext.Window, {
  initComponent : function() {
    var list = new PR.TemplateList({
      region:  'center',
      split:   true,
      margins: '5 0 5 5',
      minWidth: 300,
    });
    list.getSelectionModel().on('rowselect', this.onTemplateSelect, this);

    this.detail = new PR.TemplateDetail({
      region: 'east',
      split: true,
      width: 350,
      minWidth: 200,
      margins: '5 5 5 0',
      
      title: 'Template details',
      bodyStyle: 'padding-left:15px; padding-top:5px',

      html: '<p>Plese select Template on the left side</p>',
    });

    template_select  = new Ext.Panel({
      id: 'prw-template-card',
      layout: 'border',
      items: [ list, this.detail ]
    });


    this.parlist = new PR.TemplateParList({
      id: 'prw-parlist-card',
      title: 'Please specify Production parameters'
    });
    this.parlist.getStore().on('load',this.onTemplateLoad,this);

    this.sublist = new PR.SubrequestList({
      id: 'prw-subrequest-card',
      title: 'Select subrequest(s)'
    });
    if(!this.pData._is_leaf){
      this.sublist.store.load({params: {anode:this.pData.ID}});
    }
    
    this.sublist.getSelectionModel().on('selectionchange', 
					this.onSubrequestSelection, this);

    this.scriptlist = new Ext.TabPanel({
      items: [{ xtype: 'textarea', title: 'Something', readOnly: true }],
      enableTabScroll:  true,
      layoutOnTabChange: true, // !!! BF: forms bug !!!
      id: 'prw-scripts-card',
      activeTab:        0
    });

    Ext.apply(this, {
      title: 'Generate production script',
      width: 750,
      height: 350,
      minWidth: 500,
      minHeight: 300,
      maximizable: true,
      modal: true,
      layout: 'card',
      activeItem: 0,
      items: [ template_select, this.parlist, this.sublist, this.scriptlist ],
      buttonAlign: 'right',
      buttons: [
	{text: '&laquo; Previous', handler: this.onPrevious, scope:this,
	 id: 'prw-prev-btn', disabled: true },
	{text: 'Next &raquo;', handler: this.onNext, scope:this,
	 id: 'prw-next-btn', disabled: true },
	{text: 'Generate', handler: this.onGenerate, scope:this,
	 id: 'prw-finish-btn', disabled: true },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });
    PR.PrWorkflow.superclass.initComponent.call(this);
  },
  onTemplateSelect: function(sm, row, rec) {
    Ext.getCmp('prw-next-btn').disable();
    Ext.getCmp('prw-finish-btn').disable();
    this.detail.updateDetail(rec.data);
    this.parlist.getStore().load({ params:{tpl:rec.data.WFName} })
  },
  onTemplateLoad: function(st,rec,opt) {
    if(st.getTotalCount() != 0 || !this.pData._is_leaf)
      Ext.getCmp('prw-next-btn').enable();
    else
      Ext.getCmp('prw-finish-btn').enable();
  },
  onSubrequestSelection: function(sm) {
    var sel = sm.getSelections();
    if(!sel.length)
      Ext.getCmp('prw-finish-btn').disable();
    else
      Ext.getCmp('prw-finish-btn').enable();
  },
  onNext: function() {
    sll = this.sublist.getSelectionModel().getSelections().length;
    if(this.layout.activeItem.id == 'prw-template-card'){
      if(this.parlist.getStore().getTotalCount() == 0){
	Ext.getCmp('prw-next-btn').disable();
	if(sll)
	  Ext.getCmp('prw-finish-btn').enable();
	else
	  Ext.getCmp('prw-finish-btn').disable();
	Ext.getCmp('prw-prev-btn').enable();
	this.layout.setActiveItem('prw-subrequest-card');
      } else {
	if(this.pData._is_leaf){
	  Ext.getCmp('prw-next-btn').disable();
	  Ext.getCmp('prw-finish-btn').enable();
	} else {
	  Ext.getCmp('prw-next-btn').enable();
	  Ext.getCmp('prw-finish-btn').disable();
	}
	Ext.getCmp('prw-prev-btn').enable();
	this.layout.setActiveItem('prw-parlist-card');
      }
    } else if(this.layout.activeItem.id == 'prw-parlist-card'){
      Ext.getCmp('prw-next-btn').disable();
      if(sll)
	Ext.getCmp('prw-finish-btn').enable();
      else
	Ext.getCmp('prw-finish-btn').disable();
      this.layout.setActiveItem('prw-subrequest-card');
    }
  },
  onPrevious: function() {
    if(this.layout.activeItem.id == 'prw-subrequest-card'){
      if(this.parlist.getStore().getTotalCount() == 0){
	Ext.getCmp('prw-next-btn').enable();
	Ext.getCmp('prw-finish-btn').disable();
	Ext.getCmp('prw-prev-btn').disable();
	this.layout.setActiveItem('prw-template-card');
      } else {
	Ext.getCmp('prw-next-btn').enable();
	Ext.getCmp('prw-finish-btn').disable();
	this.layout.setActiveItem('prw-parlist-card');
      }
    } else if(this.layout.activeItem.id == 'prw-parlist-card'){
      Ext.getCmp('prw-next-btn').enable();
      Ext.getCmp('prw-finish-btn').disable();
      Ext.getCmp('prw-prev-btn').disable();
      this.layout.setActiveItem('prw-template-card');
    } else if(this.layout.activeItem.id == 'prw-scripts-card'){
      if(!this.pData._is_leaf){
	Ext.getCmp('prw-next-btn').disable();
	Ext.getCmp('prw-finish-btn').enable();
	this.layout.setActiveItem('prw-subrequest-card');
      } else {
	if(this.parlist.getStore().getTotalCount() == 0){
	  Ext.getCmp('prw-next-btn').disable();
	  Ext.getCmp('prw-prev-btn').disable();
	  Ext.getCmp('prw-finish-btn').enable();
	  this.layout.setActiveItem('prw-template-card');
	} else {
	  Ext.getCmp('prw-next-btn').disable();
	  Ext.getCmp('prw-prev-btn').enable();
	  Ext.getCmp('prw-finish-btn').enable();
	  this.layout.setActiveItem('prw-parlist-card');
	}
      }
    }
  },
  onFinish: function() {
    var pdict = {};
    pdict['RequestID'] = this.pData.ID;
    pdict['Template']  = this.detail.data.WFName;
    var recs  = this.parlist.getStore().getRange();
    for(var i=0;i<recs.length;++i)
      pdict[recs[i].data.par] = recs[i].data.value;
    
    var subr = this.sublist.getSelectionModel().getSelections();
    var slist = [];
    for(var i=0;i<subr.length;++i)
      slist = slist.concat([subr[i].data.ID]);
    pdict['Subrequests'] = slist.join(',');

    var conn = new Ext.data.Connection();
    conn.request({
      url: 'create_workflow',
      method: 'POST',
      params: pdict,
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Create Workflow fail',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	this.close();
      },
      failure: connectBugger('Create Workflow')
    });
  },
  onGenerate: function() {
    var pdict = {};
    pdict['RequestID'] = this.pData.ID;
    pdict['Template']  = this.detail.data.WFName;
    var recs  = this.parlist.getStore().getRange();
    for(var i=0;i<recs.length;++i)
      pdict[recs[i].data.par] = recs[i].data.value;
    
    var subr = this.sublist.getSelectionModel().getSelections();
    var slist = [];
    for(var i=0;i<subr.length;++i)
      slist = slist.concat([subr[i].data.ID]);
    pdict['Subrequests'] = slist.join(',');

    var conn = new Ext.data.Connection();
    conn.request({
      url: 'create_workflow',
      method: 'POST',
      params: pdict,
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Create Workflow fail',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	sll = this.sublist.getSelectionModel().getSelections().length;
	Ext.getCmp('prw-next-btn').disable();
	Ext.getCmp('prw-finish-btn').disable();
	Ext.getCmp('prw-prev-btn').enable();

	while(this.scriptlist.items.length)
	  this.scriptlist.remove(this.scriptlist.items.first(0));
	for(var i=0;i<result.Value.length;++i){
	  this.scriptlist.add(new Ext.form.TextArea({
	    title: result.Value[i].ID,
	    value: result.Value[i].Body,
	    readOnly: true
	  })).show();
	}
	Ext.getCmp('prw-finish-btn').disable();
	this.layout.setActiveItem('prw-scripts-card');
	/*
	Ext.MessageBox.show({
	  title: 'Production script',
	  msg: result.Value,
	  buttons: Ext.MessageBox.OK,
	});*/
      },
      failure: connectBugger('Create Workflow')
    });
  }

});

/**
 * PR.ReqType
 * @extends Ext.Window
 * Ask Request Type
 */
PR.ReqType = Ext.extend(Ext.Window, {
  initComponent : function() {

    this.typeCombo = new Ext.form.ComboBox(
      { fieldLabel: 'Request Type', name: 'reqType',
	store: ['Simulation','Reconstruction'],
	forceSelection: true, mode: 'local',
	triggerAction: 'all', selectOnFocus: true,
	value: 'Simulation'
      });
    Ext.apply(this, {
      title: 'Please select Request Type',
      maximizable: false,
      resizable: false,
      modal: true,
      items:  this.typeCombo,
      buttonAlign: 'center',
      buttons: [
	{text: 'Create request', handler: this.onCreate, scope:this },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });
    PR.ReqType.superclass.initComponent.call(this);
  },
  initEvents: function() {
    PR.ReqType.superclass.initEvents.call(this);
    this.addEvents( 'create' );
  },
  onCreate: function() {
    this.fireEvent('create',this.typeCombo.getValue());
    this.close();
  }
});

/**
 * PR.PassDetail
 * @extends Ext.Panel
 * Specialized Panel to show information about
 * Processing Pass.
 *
 * Markup version
 */
PR.PassDetail = Ext.extend(Ext.Panel, {
  tplMarkup: [
    '<b>ID:</b> {pID}<br/>',
    '<b>Description:</b> {pDsc}<br/>',
    '<b>Step 1:</b> {p1Html}<br/>',
    '<b>Step 2:</b> {p2Html}<br/>',
    '<b>Step 3:</b> {p3Html}<br/>',
    '<b>Step 4:</b> {p4Html}<br/>',
    '<b>Step 5:</b> {p5Html}<br/>',
    '<b>Step 6:</b> {p6Html}<br/>',
    '<b>Step 7:</b> {p7Html}<br/>'
  ],

  initComponent: function() {
    this.tpl = new Ext.Template(this.tplMarkup);
    this.data = {};
    PR.PassDetail.superclass.initComponent.call(this);
  },

  updateDetail: function(data) {
    this.data = data;
    this.tpl.overwrite(this.body, this.data);
  }
});


/**
 * PR.BkPassLoader
 * @extend PR.TreeLoader
 * Load tree to select Processing Pass from BK
 */
PR.BkPassLoader = function(config) {
  var config = config || {};
  var opts='';
  if(config.reqType)
    opts="?reqType="+config.reqType;
  Ext.apply(config, {dataUrl:'bkk_pass_tree'+opts});
  PR.BkPassLoader.superclass.constructor.call(this,config);
  this.on("beforeload", function(loader,node) {
    if(node.attributes.configName)
      this.baseParams.configName = node.attributes.configName;
    else
      delete this.baseParams.configName
    if(node.attributes.configVersion)
      this.baseParams.configVersion = node.attributes.configVersion;
    else
      delete this.baseParams.configVersion
    if(node.attributes.simCondID)
      this.baseParams.simCondID = node.attributes.simCondID;
    else
      delete this.baseParams.simCondID;
    if(node.attributes.passTotal)
      this.baseParams.passTotal = node.attributes.passTotal;
    else
      delete this.baseParams.passTotal;
  }, this);
  this.on("loadexception",loadBugger("Pass Loader"));
}
Ext.extend(PR.BkPassLoader,PR.TreeLoader);

/**
 * PR.BkAllPassesStore
 * @extends Ext.data.JsonStore
 * That is a specialized Store for registered Processing Passes
 *
 * Portal based version.
 */
PR.BkAllPassesStore = function(config) {
  var config = config || {};
  var fields = [ 'pID', 'pDsc', 'pAll' ];
  for(var i=1;i<8;++i)
    fields = fields.concat([
      'p'+i+'Lbl','p'+i+'Html','p'+i+'App',
      'p'+i+'Ver','p'+i+'Opt','p'+i+'DDDb',
      'p'+i+'CDb','p'+i+'EP']);
  var opts = ''
  if(config.reqType)
    opts='?reqType='+config.reqType;
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'bkk_passidx'+opts,
    root:       'result',
    totalProperty: 'total',
    remoteSort: true,
    fields: fields,
    listeners : { 
      'loadexception' : { 
	fn: storeBugger('list of Simulation Conditions'), 
	scope: this
      }
    }
  });
  PR.BkAllPassesStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.BkAllPassesStore,Ext.data.JsonStore);


/**
 * PR.BkAllPasses
 * @extends Ext.grid.GridPanel
 * This is a custom grid to display all registered
 * Processing Passes from bookkeeping
 */
PR.BkAllPasses = Ext.extend(Ext.grid.GridPanel, {
  // override
  initComponent: function() {
    var store = new PR.BkAllPassesStore({reqType:this.reqType});

    var pagingBar = new Ext.PagingToolbar({
      pageSize:    25,
      store:       store,
      displayInfo: true,
      displayMsg:  'Displaying {0} - {1} of {2}',
      emptyMsg:    'No passes are registered',
    });

    store.setDefaultSort('pDsc', 'ASC');
    store.load({params: {start:0, limit:pagingBar.pageSize}});

    Ext.apply(this, {
      columns: [
	{header:'Description',sortable:true, dataIndex:'pDsc',width: 70},
	{header:'Body',sortable:true, dataIndex:'pAll'}
      ],
      autoHeight:    false,
      autoWidth:     true,
      loadMask:      true,
      region:        'center',
      store:         store,
      sm:            new Ext.grid.RowSelectionModel({singleSelect: true}),
      stripeRows:    true,
      viewConfig:    {forceFit:true},
      bbar:          pagingBar
    });
    PR.BkAllPasses.superclass.initComponent.call(this);
  }
});

/**
 * PR.BkPassBrowser
 * @extends Ext.Window
 * Processing pass browser (from BK)
 */
PR.BkPassBrowser = Ext.extend(Ext.Window, {
  initComponent : function() {
    var tree = new Ext.tree.TreePanel({
      autoScroll:true,
      title: "Used",

      animate:true,
      rootVisible: false,

      loader: new PR.BkPassLoader({reqType:this.reqType}),

      root: new Ext.tree.AsyncTreeNode({text: 'Bookkeeping', id: '/'})
    });
    new Ext.tree.TreeSorter(tree, {folderSort:true});
    tree.on('click', this.onTreeClicked, this);

    var list = new PR.BkAllPasses({title: 'All',reqType:this.reqType});
    list.getSelectionModel().on('rowselect', this.onListSelect, this);

    this.detail = new PR.PassDetail({
      region: 'east',
      split: true,
      width: 200,
      minWidth: 200,
      margins: '5 5 5 0',
      
      title: 'Processing details',
      bodyStyle: 'padding-left:15px; padding-top:5px',

      html: '<p>Plese select Processing Pass on the left side</p>',

      buttonAlign: 'center',
      buttons: [
	{text: 'Select', id: 'pass-select', disabled: true },
	{text: 'Cancel', handler: this.close, scope: this }
      ]
    });
    // detail.on('render',function() { this.updateDetail({}); }, detail);

    Ext.apply(this, {
      title: 'Processing Pass browser',
      width: 750,
      height: 350,
      minWidth: 650,
      minHeight: 300,
      maximizable: true,
      modal: true,
      layout: 'border',
      items: [{
	xtype: 'tabpanel',
	region: 'center',
	split: true,
	margins: '5 0 5 5',
	minWidth: 400,
	
	activeTab: 0,
	items: [ list, tree ] 
      }, this.detail ]
    });
    PR.BkPassBrowser.superclass.initComponent.call(this);
  },
  onTreeClicked: function(n) {
    if(!n.leaf)
      return;
    this.detail.updateDetail(n.attributes);
    Ext.getCmp('pass-select').enable();
  },
  onListSelect: function(sm, row, rec) {
    this.detail.updateDetail(rec.data);
    Ext.getCmp('pass-select').enable();
  }
});


/**
 * PR.RequestEditor
 * @extends Ext.FormPanel
 * Complete request editor
 */
PR.RequestEditor = Ext.extend(Ext.FormPanel, {

  /* AZ: ExtJS bug: in case column has no fixed or Column width,
   *           it will not be realigned after show... And if it has
   *           it is realligned buggy...  */
  makeStepPanel : function(no) {
    var verStore = new Ext.data.Store({
      proxy: new Ext.data.MemoryProxy(
	{OK: true, total: 1, result: [ {v:'&nbsp;'} ]}
      ),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'v'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of Software Versions'), 
	  scope: this
	}
      }
    });
    verStore.load();

    return new Ext.form.FieldSet({ title: 'Step '+no, autoHeight: true, layout: 'column', items: [
      { layout: 'form', autoHeight: true, labelWidth: 89, width: 330, items: [
	{ layout: 'column', items: [
	  { layout: 'form', autoHeight: true, labelWidth: 89,
	    items: {xtype: 'combo', fieldLabel: 'Application',
		    name: 'p'+no+'App',
		    store: ['&nbsp;','Gauss','Boole','Brunel','Davinci','LHCb'],
		    forceSelection: true, mode: 'local',
		    triggerAction: 'all',emptyText: 'Select application',
		    selectOnFocus: true, stepno: no,
		    listeners : { 
		      'select' : { fn: this.onAppSelect, scope: this }
		    },
		    autoCreate: {
		      tag: "input", type: "text", size: "12", autocomplete: "off"
		    }
		   } 
	  } ,
	  { layout: 'form', autoHeight: true,
	    bodyStyle: 'padding-left: 5px;',
	    items: {xtype: 'combo',  hideLabel: true, 
		    // width: 100, AZ: Ha.... not working properly.... IDIOTS!!!
		    autoCreate: {
		      tag: "input", type: "text", size: "8", autocomplete: "off"
		    },
		    name: 'p'+no+'Ver',
		    store: verStore, displayField: 'v',
		    forceSelection: true, mode: 'local', selectOnFocus: true,
		    triggerAction: 'all', emptyText: 'Version',
		    listeners : {
		      'select' : { fn: this.onVerSelect, scope: this }
		    }
		   }
	  }
	]},
	{xtype: 'textfield', fieldLabel: 'Option files', 
	 name: 'p'+no+'Opt', anchor: '100%'},
	{xtype: 'textfield', fieldLabel: 'Extra packages', 
	 name: 'p'+no+'EP', anchor: '100%'}
      ]},
      { layout: 'form', autoHeight: true, labelWidth: 50, columnWidth: 1.,
	bodyStyle: 'padding-left: 5px;',
	items: [
	  {xtype: 'textfield', fieldLabel: 'CondDB',
	   name: 'p'+no+'CDb', anchor: '100%'
	  },
	  {xtype: 'textfield', fieldLabel: 'DDDB',
	   name: 'p'+no+'DDDb', anchor: '100%'
	  },
	  { xtype: 'hidden',name: 'p'+no+'Html'},
      ]}
    ]});
  },

  initComponent: function() {
    this.simCondBtn = new Ext.Button({
      xtype: 'button',text: 'Select from BK',
      handler: this.onSelectFromBk, scope: this
    });
    var sc_items = [
      {
	xtype: 'panel',
	layout: 'column',
	items: [{
	  width: 485,
	  layout: 'form', 
	  autoHeight: true, 
	  items: [{
	    xtype: 'textfield', fieldLabel: 'Description', name: 'simDesc',
	    anchor: '100%'
	  }]
	},{
	  width: 115,
	  bodyStyle: 'padding-left: 5px;',
	  items: this.simCondBtn
	}]
      },
      {xtype: 'hidden',name: 'simCondID'},
      {
	xtype: 'panel',
	layout: 'column',
	items: [{
	  layout: 'form',
	  autoHeight: true,
	  defaultType: 'textfield',
	  defaults: { width: 200 },
	  items: [
	    {fieldLabel: 'Beam',        name: 'BeamCond'},
	    {fieldLabel: 'Beam energy', name: 'BeamEnergy'},
	    {fieldLabel: 'Generator',   name: 'Generator'}
	  ]
	},{
	  layout: 'form',
	  autoHeight: 'true',
	  bodyStyle: 'padding-left: 20px;',
	  defaultType: 'textfield',
	  items: [
	    {fieldLabel: 'Magnetic field',name: 'MagneticField'},
	    {fieldLabel: 'Detector',    name: 'DetectorCond'},
	    {fieldLabel: 'Luminosity',  name: 'Luminosity'}
	  ]
	}]
      }     
    ];

    this.simCond = new Ext.form.FieldSet({
      title: 'Simulation Conditions  <font color="red">(not registered yet)</font>',
      autoHeight: true, width: 622,
      layout: 'form',
      defaultType: 'textfield',
      items: sc_items
    });

    this.inDataBtn = new Ext.Button({
      xtype: 'button',text: 'Select from BK',
      handler: this.onSelectInputFromBk, scope: this
    });

    var inProdStore = new Ext.data.Store({
      proxy: new Ext.data.MemoryProxy(
	{OK: true, total: 1, result: [ {id:'', text:''} ]}
      ),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'id'},{name: 'text'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of input productions'), scope: this
	}
      }
    });
    inProdStore.load();

    var dqStore = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'bkk_dq_list'}),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'v'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of DQ Flags'), scope: this
	}
      }
    });
    dqStore.load();


    var id_items = [
      {
	xtype: 'panel',
	layout: 'column',
	items: [{
	  width: 485,
	  layout: 'form', 
	  autoHeight: true, 
	  items: [{
	    xtype: 'textfield', fieldLabel: 'Conditions', name: 'simDesc',
	    readOnly: true, cls: 'x-item-readonly', anchor: '100%'
	  }]
	},{
	  width: 115,
	  bodyStyle: 'padding-left: 5px;',
	  items: this.inDataBtn
	}]
      },
      {xtype: 'hidden',name: 'simCondID'},
      {xtype: 'hidden',name: 'condType'},
      {xtype: 'hidden',name: 'BeamCond'}, 
      {xtype: 'hidden',name: 'MagneticField'},
      {xtype: 'hidden',name: 'Generator'},
      {xtype: 'hidden',name: 'Luminosity'},
      {xtype: 'hidden',name: 'DetectorCond'},
      {xtype: 'hidden',name: 'BeamEnergy'},
      {
	xtype: 'panel',
	layout: 'column',
	items: [{
	  layout: 'form',
	  autoHeight: true,
	  defaultType: 'textfield',
	  defaults: { width: 200 },
	  items: [
	    {fieldLabel: 'Config',        name: 'configName', 
	     readOnly: true, cls: 'x-item-readonly' },
	    {fieldLabel: 'Processing Pass',   name: 'inProPass',
	     readOnly: true, cls: 'x-item-readonly' },
	    { xtype: 'combo', fieldLabel: 'DQ flag', name: 'inDataQualityFlag',
	      store: dqStore, valueField: 'v', displayField: 'v',
	      forceSelection: true, mode: 'local',
	      triggerAction: 'all', selectOnFocus: true,
	      autoCreate: {
		tag: "input", type: "text", size: "8", autocomplete: "off"
	      }
	    }
	  ]
	},{
	  layout: 'form',
	  autoHeight: 'true',
	  bodyStyle: 'padding-left: 20px;',
	  defaultType: 'textfield',
	  items: [
	    {fieldLabel: 'version',        name: 'configVersion', 
	     readOnly: true, cls: 'x-item-readonly' },
	    {fieldLabel: 'File type',  name: 'inFileType',
	     readOnly: true, cls: 'x-item-readonly' },
	    { xtype: 'combo', fieldLabel: 'Production', 
	      hiddenName: 'inProductionID',
	      store: inProdStore, displayField: 'text', valueField: 'id',
	      forceSelection: true, mode: 'local',
	      triggerAction: 'all', selectOnFocus: true, 
	      autoCreate: {
		tag: "input", type: "text", size: "12", autocomplete: "off"
	      }
	    }
	  ]
	}]
      }     
    ];

    this.inData = new Ext.form.FieldSet({
      title: 'Input data',
      autoHeight: true, width: 622,
      layout: 'form',
      defaultType: 'textfield',
      items: id_items
    });

    var condArea = this.simCond;
    if(this.type != 'Simulation')
      condArea = this.inData;

    this.addStepBtn = new Ext.Button({
      text: 'Add step', handler: this.onAddStepBtn, scope: this
    });
    this.passBtn = new Ext.Button({
      xtype: 'button',text: 'Select from BK',
      handler: this.onPassSelectFromBk, scope: this
    });

    this.stepPanel = { 0: this.makeStepPanel(1) };

    /*
    var dbVerStore = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'soft_versions?name=DBASE&addempty&webname=DBASE_Det_SQLDDDB,DBASE_Det_XmlDDDB'}),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'v'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of Simulation Conditions'), 
	  scope: this
	}
      }
    });
    dbVerStore.load();
    */

    var proPassItems = [
      {
	xtype: 'panel', layout: 'column',
	items: [{
	  width: 485,
	  layout: 'form', 
	  autoHeight: true, 
	  items: [{
	    xtype: 'textfield', fieldLabel: 'Description', name: 'pDsc',
	    anchor: '100%'
	  }]
	},{
	  width: 115,
	  bodyStyle: 'padding-left: 5px;',
	  items: this.passBtn
	}]
      },
      { xtype: 'hidden',name: 'pID'},
      { xtype: 'hidden',name: 'pAll'},
      this.stepPanel[0],this.addStepBtn
    ];

    this.proPass = new Ext.form.FieldSet({
      title: 'Processing Pass <font color="red">(not registered yet)</font>',
      autoHeight: true, width: 622,
      layout: 'form',
      items: proPassItems
    });

    this.Request = new Ext.form.FieldSet({
      title: 'Request', layout: 'form',
      autoHeight: true, width: 622,
      items: [
	{xtype: 'textfield', fieldLabel: 'Name', name: 'reqName',
	 emptyText: "Arbitrary string for your convenience", anchor: '70%' },
	{xtype: 'panel', layout: 'column',
	items: [{layout: 'form', autoHeight: true, defaultType: 'combo',
	  items: [
	    {xtype: 'hidden',name: 'ID'},
	    {xtype: 'hidden', name: '_parent'},
	    {xtype: 'textfield', fieldLabel: 'Type', name: 'reqType',
	     readOnly: true, cls: 'x-item-readonly' },
	    /*
	    { fieldLabel: 'Type', name: 'reqType',
	      store: ['Simulation','Stripping','Reconstruction'],
	      forceSelection: true, mode: 'local',
	      triggerAction: 'all', selectOnFocus: true,
	      autoCreate: {
		tag: "input", type: "text", size: "10", autocomplete: "off"
	      },
	      listeners : { 
		'select' : { fn: this.onReqTypeSelect, scope: this }
	      }
	    }, */
	    { fieldLabel: 'Priority', name: 'reqPrio',
	      store: ['1a','1b','2a','2b'],
	      forceSelection: true, mode: 'local',
	      triggerAction: 'all', selectOnFocus: true,
	      autoCreate: {
		tag: "input", type: "text", size: "10", autocomplete: "off"
	      }
	    }
	  ]
	},{
	  layout: 'form', autoHeight: 'true', defaultType: 'combo',
	  bodyStyle: 'padding-left: 50px;', items: [
	    { xtype: 'textfield', readOnly: true, cls: 'x-item-readonly',
	      fieldLabel: 'State', name: 'currentState' },
	    {xtype: 'hidden',name: 'reqState'},
/*	    { fieldLabel: 'State', name: 'reqState',
	      store: ['New'],
	      forceSelection: true, mode: 'local',
	      triggerAction: 'all', selectOnFocus: true,
	      autoCreate: {
		tag: "input", type: "text", size: "8", autocomplete: "off"
	      }
	    }, */
	    { xtype: 'textfield', readOnly: true, cls: 'x-item-readonly',
	      fieldLabel: 'Author', name: 'reqAuthor' }
	  ]
	}]
      }]
    });

    var eventStore = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'bkk_event_types?addempty'}),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'id'},{name: 'text'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of Event Types'), scope: this
	}
      }
    });
    eventStore.load({callback: this.onEventTypesLoaded, scope: this});
    
    var evNumberHint= '';
    var evTypeHint= 'Select event type (if not subrequesting)';
    if(this.type != 'Simulation'){
      evNumberHint = '-1 to process all events';
      evTypeHint = 'Defined by input data';
    }

    this.Event = new Ext.form.FieldSet({
      title: 'Event',
      autoHeight: true, width: 622,
      layout: 'form',
      defaultType: 'textfield',
      region: 'north',
      items: [
	{ xtype: 'combo', fieldLabel: 'Type', hiddenName: 'eventType',
	  store: eventStore, displayField: 'text', valueField: 'id',
	  forceSelection: true, mode: 'local',
	  triggerAction: 'all', selectOnFocus: true, 
	  emptyText: evTypeHint,
	  autoCreate: {
	    tag: "input", type: "text", size: "60", autocomplete: "off"
	  },
	  listeners : { 
	    'select' : { fn: this.onEventTypeSelect, scope: this }
	  }
	},
	{xtype: 'numberfield', fieldLabel: 'Number', name: 'eventNumber',
	 emptyText: evNumberHint
	},
      ]
    });

    var west = new Ext.Panel({
      autoScroll: true, autoHeigth: true,
      items: [ 
	this.Request, condArea, this.proPass 
      ]
    });

    var buttons;
    if(this.state == "New"){
      buttons = [
	{text: 'Save without submission', handler: this.onSave,   scope: this},
	{text: 'Submit to the production team', handler: this.onSubmit,
	 scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    } else if(this.state == "BK Check"){
      buttons = [
	{text: 'Sign the request (BK OK)', handler: this.onBKSign,   scope: this},
	{text: 'Reject the request (better first comment why)', handler: this.onReject, scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    } else if(this.state == "BK OK"){
      buttons = [
	{text: 'Registered Simulation Conditions are OK', handler: this.onSubmit,   scope: this},
	{text: 'I no longer want this request', handler: this.onReject,
	 scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    } else if(this.state == "Submitted" || this.state == "Tech OK" || this.state == "PPG OK"){
      buttons = [
	{text: 'Sign the request', handler: this.onSign,   scope: this},
	{text: 'Reject the request (better first comment why)', handler: this.onReject, scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    } else if(this.state == "Accepted"){
      buttons = [
	{text: 'Activate', handler: this.onActivate,   scope: this},
	{text: 'Reject the request (better first comment why)', handler: this.onReject, scope: this},
	{text: 'Return to Tech. expert', handler: this.onReturn, scope: this},
	{text: 'Save changes', handler: this.onSave,   scope: this},
	{text: 'Generate', handler: this.onWorkflow, scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    } else if(this.state == "Active"){
      buttons = [
	{text: 'Done', handler: this.onDone,   scope: this},
	{text: 'Cancel request (better first comment why)', handler: this.onCancelReq, scope: this},
	{text: 'Save changes', handler: this.onSave,   scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ];
    }

    Ext.apply(this, {
      items: {
	xtype: 'panel',
	border: false,
	anchor: '100% 100%',
	layout: 'border',
	items: [
	  { region: 'west', width: 639, layout: 'fit', items: west },
	  { region: 'center', margins: '0 0 0 2', anchor: '100% 100%', 
	    layout: 'border',
	    items: [ this.Event,
	      {xtype: 'fieldset', title: 'Comments', 
	       layout: 'fit', region: 'center', margins: '5 0 0 0',
	       items: { xtype: 'textarea', hideLabel: true, 
			name: 'reqComment' } }
	    ]
	  }
	]
      },
      buttonAlign: 'left',
      frame: true,
      buttons: buttons
    });
    PR.RequestEditor.superclass.initComponent.call(this);
  },

  initEvents: function() {
    PR.RequestEditor.superclass.initEvents.call(this);
    this.addEvents( 'saved' );
  },

  onCancel: function() {
    // ?? is there better way to do this ??
    this.ownerCt.remove(this);
  },

  checkProcessingPass: function() {
    var i;
    pAll = '';
    for(i=1;i<8;++i){
      if(!this.stepPanel[i-1])
	break;
      var pApp = this.getAppCombo(i).getValue();
      if(!pApp)
	break;
      var pVer = this.getVerCombo(i).getValue();
      if(!pVer){
	Ext.MessageBox.show({
	  title: 'Error',
	  msg: 'You have to select version of '+pApp,
	  buttons: Ext.MessageBox.OK,
	  icon: Ext.MessageBox.ERROR
	});
	return false;
      }
      var pOpt  = this.getOpt(i).getValue();
      var pDDDb = this.getDDDb(i).getValue();
      var pCDb  = this.getCDb(i).getValue();
      var pEP   = this.getEP(i).getValue();
      var pLbl  = pApp+'-'+pVer;
      if(pAll)
	pAll = pAll+',';
      pAll = pAll+pLbl;
      var pHtml = '<b>Pass '+i+':</b> '+pLbl;
      if(pOpt)
	pHtml = pHtml+'<br>&nbsp;&nbsp;Options: '+pOpt;
      if(pDDDb)
	pHtml = pHtml+'<br>&nbsp;&nbsp;DDDb: '+pDDDb;
      if(pCDb)
	pHtml = pHtml+'<br>&nbsp;&nbsp;condDb: '+pCDb;
      if(pEP)
	pHtml = pHtml+'<br>&nbsp;&nbsp;extraPackages: '+pEP;
      pHtml = pHtml+'<br>';
      this.getHtml(i).setValue(pHtml);
    }
    this.getForm().findField('pAll').setValue(pAll);
    for(var j=i;j<8;++j){
      if(!this.stepPanel[j-1])
	continue;
      if(this.getAppCombo(j).getValue()){
	Ext.MessageBox.show({
	  title: 'Error',
	  msg: 'Empty steps in Processing Pass are not supported',
	  buttons: Ext.MessageBox.OK,
	  icon: Ext.MessageBox.ERROR
	});
	return false;
      }
    }
    for(var j=i;j<8;++j)
      if(this.stepPanel[j-1] && j > 1){
	this.proPass.remove(this.stepPanel[j-1],true);
	delete this.stepPanel[j-1];
      }
    this.proPass.doLayout();
    return true;
  },

  _submit : function() {
    this.getForm().submit({
      failure: ajaxBugger('saving request'),
      success: this.onSaveSuccess,
      scope: this,
      url: 'save',
      waitMsg: 'Uploading the request'
    });
  },

  onSave: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue(this.state);
    this._submit();
  },

  fieldValue: function(name) {
    return this.getForm().findField(name).getValue();
  },

  onSubmit: function() {
    var toBK_Check = false;
    if(!this.fieldValue('simCondID')){
      if(this.type != 'Simulation'){
	Ext.MessageBox.show({
	  title: 'Incomplete request',
	  msg: "Please specify input data for processing. ",
	  buttons: Ext.MessageBox.OK,
	  icon: Ext.MessageBox.ERROR
	});
	return;
      }
      toBK_Check = true;
      if(!this.fieldValue('simDesc') ||
	 !this.fieldValue('Generator') ||
	 !this.fieldValue('MagneticField') ||
	 !this.fieldValue('BeamEnergy') ||
	 !this.fieldValue('Luminosity') ||
	 !this.fieldValue('DetectorCond') ||
	 !this.fieldValue('BeamCond')){
	    Ext.MessageBox.show({
	      title: 'Incomplete request',
	      msg: "Specified Simulation Conditions are not yet registered. " +
		"Please fill ALL simulation condition fields.",
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	return;
      }
    }
    if(!this.checkProcessingPass())
      return;
    if(!this.fieldValue('pID')){
      if(!this.fieldValue('pDsc') ||
	 !this.fieldValue('pAll')){
	    Ext.MessageBox.show({
	      title: 'Incomplete request',
	      msg: "Specified Processing Pass is not yet registered. " +
		"You have to specify a group and at least one Step "+
		"(Application and it's version).",
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	return;
      }
    }
    // Event type/subrequests consistency will be checked in DB part
    if(!this.fieldValue('eventType')){
      if(this.fieldValue('eventNumber')){
	Ext.MessageBox.show({
	  title: 'Incomplete request',
	  msg: "You have specified the number of events, but no type.",
	  buttons: Ext.MessageBox.OK,
	  icon: Ext.MessageBox.ERROR
	});
	return;
      }
    } else if(!this.fieldValue('eventNumber')){
      Ext.MessageBox.show({
	title: 'Incomplete request',
	msg: "You have to specify the number of events.",
	buttons: Ext.MessageBox.OK,
	icon: Ext.MessageBox.ERROR
      });
      return;
    }
    if(this.state == "BK OK"){
      this.__realSubmit();
      return;
    }
    var confirm_text = "You are about to submit the request. Note, that "+
      "you no longer can modify it after that. Proceed?"
    if(toBK_Check)
      confirm_text = "You are asking for unregistered Simulation Conditions. "+
      "You request will be send to BK Expert first for confirmation. "+
      "Note that you have to resign the request afterward. "+
      "Also note that you no longer can modify the request after submission. "+
      "Proceed?";
    Ext.MessageBox.confirm('Submit', confirm_text,
			   function(btn){
			     if(btn == 'yes')
			       this.__realSubmit()
			   }, this);
  },

  __realSubmit: function() {
    if(this.state == 'New'){
      if(!this.fieldValue('simCondID'))
	this.getForm().findField('reqState').setValue('BK Check');
      else
	this.getForm().findField('reqState').setValue('Submitted');
    } else if(this.state == "BK OK")
      this.getForm().findField('reqState').setValue('Submitted');
    this._submit();
  },

  onBKSign: function() {
    if(!this.fieldValue('simCondID')){
      Ext.MessageBox.show({
	title: 'Incomplete request',
	msg: "Currently Simulation Conditions must be registered with BK tools manually " +
	  "and then selected here ('Select from BK' button).",
	buttons: Ext.MessageBox.OK,
	icon: Ext.MessageBox.ERROR
      });
      return;
    }
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('BK OK');
    this._submit();
  },

  onSign: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('Accepted');
    this._submit();
  },

  onReturn: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('PPG OK');
    this._submit();
  },

  onActivate: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('Active');
    this._submit();
  },

  onDone: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('Done');
    this._submit();
  },

  onCancelReq: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('Cancelled');
    this._submit();
  },

  onReject: function() {
    if(!this.checkProcessingPass())
      return;
    this.getForm().findField('reqState').setValue('Rejected');
    this._submit();
  },

  onSaveSuccess: function() {
    this.fireEvent('saved',this);
    this.ownerCt.remove(this);
  },


  onEventTypesLoaded: function(){
    // Combobox bug fix...
    var evCombo = this.getForm().findField('eventType');
    var eventType = evCombo.hiddenField.value;
    if(eventType)
      evCombo.setValue(eventType);
  },

  onInProdLoaded: function(){
    // Combobox bug fix...
    var ipCombo = this.getForm().findField('inProductionID');
    if(!ipCombo)
      return;
    var prod = ipCombo.hiddenField.value;
    if(prod)
      ipCombo.setValue(prod);
  },

  loadRecord: function(rm,r) {
    var id = this.getForm().findField('ID');

    if(!r || typeof r.data.ID == 'undefined'){
      // PR.hideField(id);

      /*
      var DN=gPageDescription.userData.DN;
      var CNpos = DN.indexOf('CN=');
      var reqAuthor;
      if(CNpos >=0)
	reqAuthor=DN.substring(CNpos+3);
      else
	reqAuthor=DN;
      alert(Ext.util.JSON.encode(gPageDescription.userData));
      */
      reqAuthor=gPageDescription.userData.username;
      this.getForm().setValues({
	reqType: this.type,
	reqState: 'New',
	reqPrio:  '2b',
	reqAuthor: reqAuthor
      });
      this.getForm().findField('ID').disable();
    }

    if(r) {
      this.getForm().loadRecord(r);
      this.pData = r.data; // a bit more than required...
    }
    this.getForm().findField('currentState').setValue(this.state);
    this.setRequest(rm);
    this.setProPass(rm);
    if(r){
      this.setSimCond(rm);
      this.setInData(rm);
      this.setEventForm(rm);
    } else {
      this.setInData(null);
      this.setEventForm({state: 'New', user: reqAuthor, author: reqAuthor});
    }
  },

  setEventForm : function(rm){
    var force = true;
    if(rm.state == 'New' && rm.user == rm.author)
      force = false;
    var evType = this.getForm().findField('eventType');
    if(this.type != 'Simulation'){
      PR.setReadOnly(evType,true);
    }else
      PR.setReadOnly(evType,force);
    PR.setReadOnly(this.getForm().findField('eventNumber'),force);
    var emptyText = '';
    if(rm.state != 'New')
      emptyText = "(see subrequests)";
    else if(force)
      emptyText = "(not yet set)";
    if(emptyText){
      if(!evType.getRawValue())
	evType.setRawValue(emptyText); // fix a bug...
      evType.emptyText = emptyText;
      evType.applyEmptyText();
    }
  },

  onSelectFromBk: function() {
    var idField = this.getForm().findField('simCondID');
    if( idField.getValue() == '' ) {
      this.scb = new PR.BkSimCondBrowser();
      Ext.getCmp('sim-cond-select').on('click',this.onSimCondSelected,this);
      this.scb.show();
    } else {
      idField.setValue('');
      this.setSimCond(null);
    }
  },

  onSelectInputFromBk: function() {
    this.indb = new PR.BkInDataBrowser();
    Ext.getCmp('in-data-select').on('click',this.onInDataSelected,this);
    this.indb.show();
  },

  setSimCond: function(rm){
    if(this.type != 'Simulation')
      return;
    var force = true;
    if(rm){
      if(rm.state == 'New' && rm.user == rm.author)
	force = false;
      if(rm.state == 'BK Check' && rm.group == 'lhcb_bk')
	force = false;
    } else
      force = false;
    var id = this.getForm().findField('simCondID').getValue();
    if(id)
      this.simCond.setTitle('Simulation Conditions(ID: '+id+')');
    else
      this.simCond.setTitle(
	'Simulation Conditions  <font color="red">(not registered yet)</font>'
      );
    if(id)
      this.simCondBtn.setText('Customize');
    else
      this.simCondBtn.setText('Select from BK');
    if(force)
      this.simCondBtn.hide();
    var fields = this.simCond.findByType('textfield');
    for(var i=0; i<fields.length; ++i)
      PR.setReadOnly(fields[i],force || id);
  },

  setInData: function(rm){
    if(this.type == 'Simulation')
      return;
    var force = true;
    var id = '';
    if(rm){
      if(rm.state == 'New' && rm.user == rm.author)
	force = false;
    } else
      force = false;
    var id = this.getForm().findField('simCondID').getValue();
    if(force)
      this.inDataBtn.hide();
    var prodCombo = this.getForm().findField('inProductionID');
    var prod = prodCombo.getValue();
    // prodCombo.reset();
    if(force){
      var text = prod;
      if(text == '0')
	text = 'ALL';
      prodCombo.store.proxy = new Ext.data.MemoryProxy(
	{OK: true, total: 1, result: [ {id:prod, text:text} ]}
      );
      prodCombo.store.load({callback: this.onInProdLoaded, scope: this});
    } else {
      if(!id){
	prodCombo.store.proxy = new Ext.data.MemoryProxy(
	  {OK: true, total: 1, result: [ {id:'', text:''} ]}
	);
      } else {
	if(!prod)
	  prodCombo.setValue('0');
	var configName=this.getForm().findField('configName').getValue();
	var configVersion=this.getForm().findField('configVersion').getValue();
	var simCondID=this.getForm().findField('simCondID').getValue();
	var inProPass=this.getForm().findField('inProPass').getValue();
	var eventType=this.getForm().findField('eventType').getValue();
	prodCombo.store.proxy = new Ext.data.HttpProxy({
	  url: 'bkk_input_prod?configName='+configName+
	    '&configVersion='+configVersion+
	    '&simCondID='+simCondID+
	    '&inProPass='+inProPass+
	    '&eventType='+eventType});
      }
      prodCombo.store.load({callback: this.onInProdLoaded, scope: this});
    }
    PR.setReadOnly(prodCombo,force || !id);

    var dqCombo = this.getForm().findField('inDataQualityFlag');
    var dq = dqCombo.getValue();
    if(!force && id && !dq)
      dqCombo.setValue('ALL');
    PR.setReadOnly(dqCombo,force || !id);
  },

  onSimCondSelected: function() {
    this.getForm().setValues(this.scb.detail.data);
    this.scb.close();
    this.setSimCond(null);
  },

  onInDataSelected: function() {
    this.getForm().setValues(this.indb.detail.data);
    this.indb.close();
    var evType = this.indb.detail.data.evType;
    if(evType)
      this.getForm().findField('eventType').setValue(evType);
    this.setInData(null);
  },

  onPassSelectFromBk: function() {
    var idField = this.getForm().findField('pID');
    if( idField.getValue() == '' ) {
      this.pb = new PR.BkPassBrowser({reqType:this.fieldValue('reqType')});
      Ext.getCmp('pass-select').on('click',this.onPassSelected,this);
      this.pb.show();
    } else {
      idField.setValue('');
      this.passBtn.setText('Select from BK');
      this.setProPass(null);
    }
  },

  addStepPanel: function() {
    var i;
    for(i=0;i<6 && this.stepPanel[i];++i);
    this.stepPanel[i] = this.makeStepPanel(i+1);
    var myidx=this.proPass.items.indexOf(this.addStepBtn);
    this.proPass.insert(myidx,this.stepPanel[i]);
    if(i==6)
      this.addStepBtn.hide();
  },

  getAppCombo: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'App')[0];
  },

  getVerCombo: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'Ver')[0];
  },

  getDDDb: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'DDDb')[0];
  },

  getCDb: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'CDb')[0];
  },

  getOpt: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'Opt')[0];
  },

  getEP: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'EP')[0];
  },

  getHtml: function(i) {
    return this.stepPanel[i-1].find('name', 'p'+i+'Html')[0];
  },

  setProPass: function(rm) {
    var force = true;
    var id = this.fieldValue('pID');
    if(rm){
      if(rm.state == 'New' && rm.user == rm.author)
	force = false;
      if(rm.state == 'Submitted' && rm.group == 'lhcb_tech')
	force = false;
      if(rm.state == 'PPG OK' && rm.group == 'lhcb_tech')
	force = false;
      if(rm.group == 'lhcb_prmgr')
	force = false;
    } else
      force = false;
    if(id){
      this.proPass.setTitle('Processing Pass(ID: '+id+')');
      this.passBtn.setText('Customize');
    } else {
      this.proPass.setTitle(
	'Processing Pass <font color="red">(not registered yet)</font>'
      );
      this.passBtn.setText('Select from BK');
    }
    if(force)
      this.passBtn.hide();
    var i,j;
    for(i=0;i<7 && this.pData;++i){
      var pApp,pVer;
      pApp = this.pData['p'+(i+1)+'App']; 
      if(!pApp)
	break;
      if(!this.stepPanel[i])
	this.addStepPanel();
      var appCombo = this.getAppCombo(i+1);
      appCombo.setValue(pApp);
      pVer = this.pData['p'+(i+1)+'Ver'];
      this.onAppSet(appCombo,pVer);
      var verCombo = this.getVerCombo(i+1);
      verCombo.setValue(pVer);
      this.getOpt(i+1).setValue(this.pData['p'+(i+1)+'Opt']);
      this.getDDDb(i+1).setValue(this.pData['p'+(i+1)+'DDDb']);
      this.getCDb(i+1).setValue(this.pData['p'+(i+1)+'CDb']);
      this.getEP(i+1).setValue(this.pData['p'+(i+1)+'EP']);
      PR.setReadOnly(verCombo,id || force);
      PR.setReadOnly(appCombo,id || force);
      PR.setReadOnly(this.getOpt(i+1),id || force);
      PR.setReadOnly(this.getDDDb(i+1),id || force);
      PR.setReadOnly(this.getCDb(i+1),id || force);
      PR.setReadOnly(this.getEP(i+1),id || force);
    }
    for(j=i;j<7;++j){
      if(j==0 && force){
	this.proPass.remove(this.stepPanel[j],true);
	delete this.stepPanel[j];
      }
      if(j<1 || !this.stepPanel[j])
	continue;
      this.proPass.remove(this.stepPanel[j],true);
      delete this.stepPanel[j];
    }
    if(i==7 || force || id){
      this.addStepBtn.hide();
    } else
      this.addStepBtn.show();

    PR.setReadOnly(PR.getField(this.proPass,'pDsc'),id || force);

    if(!id){
      var app = 'Brunel';
      if(this.fieldValue('reqType') == 'Simulation')
	app = 'Gauss';
      var appCombo = this.getAppCombo(1);
      appCombo.setValue(app);
      if(this.pData)
	pVer = this.pData['p1Ver'];
      else
	pVer = '';
      this.onAppSet(appCombo,pVer);
      var verCombo = this.getVerCombo(1);
      verCombo.setValue(pVer);      
      PR.setReadOnly(appCombo,true);
    }

    this.proPass.doLayout();
  },

  onPassSelected: function() {
    this.getForm().setValues(this.pb.detail.data);
    this.pData = this.pb.detail.data; // we don't have all fields yet...
    this.setProPass(null);
    this.pb.close();
  },

  onAddStepBtn: function() {
    this.addStepPanel();
    this.proPass.doLayout();
  },

  onAppSelect: function(combo,record,index) {
    // The following is not working due to old (3.07) known bug.
    // Must be fixed in 3.0 SVN
    // var verCombo = this.getForm().findField('pass'+combo.stepno+'Ver')
    var verCombo = this.getVerCombo(combo.stepno);
    verCombo.reset();
    if(combo.getValue() == '&nbsp;'){
      combo.setValue('');
      verCombo.store.proxy = new Ext.data.MemoryProxy(
	{OK: true, total: 1, result: [ {v:'&nbsp;'} ]}
      );
    } else {
      verCombo.store.proxy = new Ext.data.HttpProxy({
	url: 'soft_versions?name='+combo.getValue().toUpperCase()});
    }
    verCombo.store.load();
  },

  onAppSet: function(appCombo,verValue) {
    // different from onAppSelect since version
    // can be not in 'available' list (historical...)
    var verCombo = this.getVerCombo(appCombo.stepno);
    verCombo.reset();
    verCombo.store.proxy = new Ext.data.HttpProxy({
      url: 'soft_versions?name='+appCombo.getValue().toUpperCase()
	+'&add='+verValue});
    verCombo.store.load();
  },

  onVerSelect: function(combo,record,index) {
    if(combo.getValue() == '&nbsp;'){
      combo.setValue('');
      return;
    }
  },

  onReqTypeSelect: function(combo,record,index) {
    if(combo.getValue() == 'Simulation')
      return;
    Ext.MessageBox.show({
      title: 'Not implemented',
      msg: combo.getValue()+' request type is not implemented yet. Sorry.',
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.INFO
    });
    combo.setValue('Simulation');
  },

  onEventTypeSelect: function(combo,record,index) {
    if(combo.getValue() == 99999999)
      combo.setValue('');
  },

  setRequest: function(rm) {
    var id         = this.getForm().findField('ID').getValue();
    var force  = true;

    if(!rm)
      force = false
    else if(rm.state == 'New' && rm.user == rm.author)
      force = false;

    PR.setReadOnly(this.getForm().findField('reqName'),force);
    PR.setReadOnly(this.getForm().findField('reqPrio'),
		   (this.state!='Submitted' && this.state!='Tech OK') ||
		   rm.group != 'lhcb_ppg');
  },

  onWorkflow: function() {
    prw = new PR.PrWorkflow({ pData: this.pData });
    prw.show();
  },

});
Ext.reg('preditor', PR.RequestEditor);


/**
 * PR.SubRequestEditor
 * @extends Ext.FormPanel
 * Subrequest editor.
 *   We allow only one modification is subrequesting.
 */
PR.SubRequestEditor = Ext.extend(Ext.FormPanel, {

  initComponent: function() {
    var eventStore = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'bkk_event_types?addempty'}),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      }, [{name: 'id'},{name: 'text'}]),
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('list of Event Types'), scope: this
	}
      }
    });
    eventStore.load({callback: this.onEventTypesLoaded, scope: this});
		
    this.Event = new Ext.form.FieldSet({
      title: 'Event',
      autoHeight: true, width: 622,
      layout: 'form',
      defaultType: 'textfield',
      region: 'north',
      items: [
	{ xtype: 'combo', fieldLabel: 'Type', hiddenName: 'eventType',
	  store: eventStore, displayField: 'text', valueField: 'id',
	  forceSelection: true, mode: 'local',
	  triggerAction: 'all', selectOnFocus: true, 
	  emptyText: 'Select event type',
	  autoCreate: {
	    tag: "input", type: "text", size: "60", autocomplete: "off"
	  },
	  listeners : { 
	    'select' : { fn: this.onEventTypeSelect, scope: this }
	  }
	},
	{xtype: 'numberfield', fieldLabel: 'Number', name: 'eventNumber'},
	{xtype: 'hidden', name: 'ID'},
	{xtype: 'hidden', name: '_parent'},
	{xtype: 'hidden', name: '_master'},
	{xtype: 'hidden', name: 'reqType'},
	{xtype: 'hidden', name: 'reqState'},
	{xtype: 'hidden', name: 'reqPrio'},
	{xtype: 'hidden', name: 'simDesc'},
	{xtype: 'hidden', name: 'pDsc'},
	{xtype: 'hidden', name: 'pAll'},
      ]
    });

    this.Original = new PR.RequestDetail({
      title:    'Original request ',
      autoScroll: true,
      frame: true
    });


    Ext.apply(this, {
      items: {
	xtype: 'panel',
	border: false,
	anchor: '100% 100%',
	layout: 'border',
	items: [
	  { region: 'west', width: 639, layout: 'fit', items: this.Original },
	  { region: 'center', margins: '0 0 0 2', anchor: '100% 100%', 
	    layout: 'border',
	    items: [ this.Event,
	      {xtype: 'fieldset', title: 'Comments', 
	       layout: 'fit', region: 'center', margins: '5 0 0 0',
	       items: { xtype: 'textarea', hideLabel: true, 
			name: 'reqComment' } }
	    ]
	  }
	]
      },
      buttonAlign: 'left',
      frame: true,
      buttons: [
	{text: 'Save',   handler: this.onSave,   scope: this},
	{text: 'Cancel', handler: this.onCancel, scope: this}
      ]
    });
    PR.SubRequestEditor.superclass.initComponent.call(this);
  },

  initEvents: function() {
    PR.SubRequestEditor.superclass.initEvents.call(this);
    this.addEvents( 'saved' );
  },

  onCancel: function() {
    // ?? is there better way to do this ??
    if(this.ownerCt)
      this.ownerCt.remove(this);
  },

  onSave: function() {
    if(! this.getForm().findField('eventType').getValue() ||
       ! this.getForm().findField('eventNumber').getValue()) {
      Ext.MessageBox.show({
	title: 'Incomplete subrequest',
	msg: "You have to specify event type and number. " +
	  "Please fill ALL simulation condition fields.",
	buttons: Ext.MessageBox.OK,
	icon: Ext.MessageBox.ERROR
      });
      return;
    }

    this.getForm().findField('_parent').setValue(this.parentPath[0]);
    this.getForm().findField('_master').setValue(
      this.parentPath[this.parentPath.length-1]);
    this.getForm().submit({
      failure: ajaxBugger('saving request'),
      success: this.onSaveSuccess,
      scope: this,
      url: 'save',
      waitMsg: 'Uploading the request'
    });
  },

  onSaveSuccess: function() {
    this.fireEvent('saved',this);
    this.ownerCt.remove(this);
  },


  onEventTypesLoaded: function(){
    // Combobox bug fix...
    var evCombo = this.getForm().findField('eventType');
    var eventType = evCombo.hiddenField.value;
    if(eventType)
      evCombo.setValue(eventType);
  },

  loadRecord: function(r,setro) {
    var id = this.getForm().findField('ID');

    if(r) {
      this.getForm().loadRecord(r);
      this.pData = r.data; // a bit more than required...
      if(setro){
	PR.setReadOnly(this.getForm().findField('eventType'),true);
	PR.setReadOnly(this.getForm().findField('eventNumber'),true);
      }
    }

    if(!r || typeof r.data.ID == 'undefined'){
      this.getForm().findField('ID').disable();
    }
  },

  onEventTypeSelect: function(combo,record,index) {
    if(combo.getValue() == 99999999)
      combo.setValue('');
  }

});

storeBugger = function(origin) {
  return function(me,options,response,e) {
    var str;
    if(e) {
      try {
        var result = Ext.decode(response.responseText);
        if ( result.OK )
          str = "page and web service versions mismatch.";
        else
          str = result.Message;
      } catch (e2) {
        str = "unparsable reply from the portal: "+e.message;
      }
    } else
      str = "can't communicate with portal";
    // Ext.Msg.alert('While loading '+origin, str);
    Ext.MessageBox.show({
      title: 'While loading '+origin,
      msg: str,
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.ERROR
    });
  }
}

loadBugger = function(origin) {
  return function(me,obj,response) {
    var str;
    if (response) {
      try {
	var result = Ext.decode(response.responseText);
	if ( result.OK )
          str = "page and web service versions mismatch.";
	else
          str = result.Message;
      } catch (e2) {
	str = "unparsable reply from the portal: "+e2.message;
      }
    } else
      str = "can't communicate with portal";
    // Ext.Msg.alert('While loading '+origin, str);
    Ext.MessageBox.show({
      title: 'While loading '+origin,
      msg: str,
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.ERROR
    });
  }
}

connectBugger = function(origin) {
  return function(response,options) {
    var str;
    if (response) {
      try {
	var result = Ext.decode(response.responseText);
	if ( result.OK )
          str = "page and web service versions mismatch.";
	else
          str = result.Message;
      } catch (e2) {
	str = "unparsable reply from the portal: "+e2.message;
      }
    } else
      str = "can't communicate with portal";
    // Ext.Msg.alert('While loading '+origin, str);
    Ext.MessageBox.show({
      title: 'While loading '+origin,
      msg: str,
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.ERROR
    });
  }
}

ajaxBugger = function(origin) {
  return function(form,action) {
    if(action.failureType) {
      if(action.failureType == Ext.form.Action.CLIENT_INVALID)
	str = "Please check entered data";
      else
	str = "Problems in communication with portal";
    } else
      str = action.result.Message;
    Ext.MessageBox.show({
      title: 'While '+origin,
      msg: str,
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.ERROR
    });
  }
}

/**
 * PR.ProductionManager
 * @extends Ext.Window
 * Manage productions for specified in rID request
 */
PR.ProductionManager = Ext.extend(Ext.Window, {
  initComponent: function() {
    this.menu = new Ext.menu.Menu();
    this.modyfied = false; // to trigger "save" event

    this.store = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'progress?RequestID='+this.rID
      }),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      },[{name: 'ProductionID'},
	 {name: 'RequestID'},
	 {name: 'Used'},
	 {name: 'BkEvents'}
	]),		     
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('production progress'), scope: this
	}
      }
    });
    this.store.load();

    Ext.apply(this, {
      modal: true,
      width: 250,
      height: 200,
      layout: 'border',
      items: [
	{ xtype:'grid', region: 'center', margins: '2 2 2 2',
	  store: this.store,
	  columns: [
	    {header:'Used', dataIndex:'Used', renderer: this.renderUse},
	    {header:'Production',   dataIndex:'ProductionID'},
	    {header:'Events in BK', dataIndex:'BkEvents'}
	  ],
	  sm:            new Ext.grid.RowSelectionModel({singleSelect: true}),
	  stripeRows:    true,
	  viewConfig:    {forceFit:true},
	},
	{ xtype:'form', region: 'south', margins: '2 2 2 2',
	  autoHeight: true,
	  frame: true, items: {
	    layout: 'column',
	    items: [{ layout: 'form', items:{
	      xtype: 'numberfield', allowDecimals: false, name: 'ProductionID',
	      emptyText: 'Enter production ID', hideLabel: true
	    }},{
	      layout: 'form', bodyStyle: 'padding-left: 5px;', items:{
		xtype: 'button', text: 'Add',
		handler: this.onAdd, scope: this
	      }
	    }]
	  }
	}
      ]
    });
    PR.ProductionManager.superclass.initComponent.call(this);
  },

  onRowClick: function(grid, rowIdx, e) {
    var r  = grid.getStore().getAt(rowIdx);
    var id = r.data.ProductionID;
    this.menu.removeAll();
    this.menu.add( 
      {handler: function() {this.doRemove(r)},scope: this,text: 'Remove' }
    );
    if(r.data.Used)
      usedLabel = 'Mark unused';
    else
      usedLabel = 'Mark used';
    this.menu.add( 
      {handler: function() {this.toggleUsed(r);},scope: this,text: usedLabel }
    );
    this.menu.showAt(Ext.EventObject.xy);
  },

  doRemove : function(r){
    this.action('Deassociate production','remove_production',
		{ ProductionID: r.data.ProductionID }, this.onModifySuccess);
  },

  toggleUsed : function(r){
    this.action('Toggle production use','use_production',
		{ ProductionID: r.data.ProductionID,
		  Used: !r.data.Used
		}, this.onModifySuccess);
  },

  onAdd: function() {
    var form = this.findByType('form')[0];
    productionID = form.getForm().findField('ProductionID').getValue();
    if(!productionID)
      return;
    form.getForm().submit({
      failure: ajaxBugger('adding production'),
      success: this.onModifySuccess,
      scope: this,
      url: 'add_production?RequestID='+this.rID,
      waitMsg: 'Assigning production'
    });
  },

  onModifySuccess: function() {
    this.modyfied = true;
    this.store.reload();
  },

  renderUse: function (val) {
    if(val)
      return '<span style="color:green;">yes</span>';
    return '<span style="color:red;">no</span>';
  },

  initEvents: function() {
    PR.ProductionManager.superclass.initEvents.call(this);
    this.addEvents( 'saved' );
    this.findByType('grid')[0].on('rowclick',this.onRowClick, this);
    this.on('close',function(win){
      if(win.modyfied)
	win.fireEvent('saved',win)
    });
  },

  action: function(name,url,params,cbsuccess) {
    var conn = new Ext.data.Connection();
    conn.request({
      url: url,
      method: 'GET',
      params: params,
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: name + ' fail',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	if(cbsuccess)
	  cbsuccess.call(this);
      },
      failure: connectBugger(name)
    });
  }

});

/**
 * PR.HistoryViewer
 * @extends Ext.Window
 * Show history of state chages for the request
 */
PR.HistoryViewer = Ext.extend(Ext.Window, {
  initComponent: function() {
    this.store = new Ext.data.Store({
      proxy: new Ext.data.HttpProxy({
	url: 'history?RequestID='+this.rID
      }),
      reader: new Ext.data.JsonReader({
        totalProperty: 'total',
	root:'result'
      },[{name: 'RequestID'},
	 {name: 'RequestState'},
	 {name: 'RequestUser'},
	 {name: 'TimeStamp'}
	]),		     
      listeners : { 
	'loadexception' : { 
	  fn: storeBugger('history'), scope: this
	}
      }
    });
    this.store.load();

    Ext.apply(this, {
      modal: true,
      width: 500,
      height: 300,
      layout: 'fit',
      items: 
      { xtype:'grid',
	store: this.store,
	columns: [
	  {header:'Time', dataIndex:'TimeStamp'},
	  {header:'State',dataIndex:'RequestState'},
	  {header:'Changed by', dataIndex:'RequestUser'}
	],
	stripeRows:    true,
	viewConfig:    {forceFit:true},
      }
    });
    PR.HistoryViewer.superclass.initComponent.call(this);
  }
});

/**
 * PR.RequestListStore
 * @extends  Ext.ux.maximgb.treegrid.AdjacencyListStore
 * That is a specialized Store for Production Requests
 *
 * Portal based version.
 */
PR.RequestListStore = function(config) {
  var config = config || {};
  var fields = [
    {name:'ID', type: 'auto'},
    {name:'reqName'},
    {name:'reqType'},
    {name:'reqState'},
    {name:'reqPrio'},
    {name:'reqAuthor'},

    {name:'simCondID'},
    {name:'simDesc'},
    {name:'Generator'},
    {name:'MagneticField'},
    {name:'BeamEnergy'},
    {name:'Luminosity'},
    {name:'DetectorCond'},
    {name:'BeamCond'},
    
    {name: 'configName'}, 
    {name: 'configVersion'},
    {name: 'condType'},
    {name: 'inProPass'}, 
    {name: 'inFileType'},
    {name: 'inProductionID'},
    {name: 'inDataQualityFlag'},

    {name:'pID'},
    {name:'pDsc'},
    {name:'pAll'},
    
    {name:'eventType'},
    {name:'eventNumber'},

    {name:'reqComment'},
    {name:'reqDesc'},

    {name:'eventBK'},
    {name:'EventNumberTotal'},
    {name:'eventBKTotal'},
    {name:'progress'},
    {name:'creationTime'},
    {name:'lastUpdateTime'},

    {name:'_parent', type: 'auto'},
    {name:'_is_leaf', type: 'bool'},
    {name:'_master', type: 'auto'}
  ];
  for(var i=1;i<8;++i)
    fields = fields.concat([
      {name:'p'+i+'App'},
      {name:'p'+i+'Ver'},
      {name:'p'+i+'Opt'},
      {name:'p'+i+'DDDb'},
      {name:'p'+i+'CDb'},
      {name:'p'+i+'EP'},
      {name:'p'+i+'Html'}
    ]);
  var record = Ext.data.Record.create(fields);
  Ext.applyIf(config, {
    // autoLoad:   true,
    url:        'list',
    remoteSort: true,
    reader: new Ext.data.JsonReader({
      root:       'result',
      totalProperty: 'total',
      id: 'ID'
    }, record),
    listeners : {
      'loadexception' : { 
	fn: storeBugger('list of Requests'), 
	scope: this 
      }
    }
  });
  PR.RequestListStore.superclass.constructor.call(this, config);
}
Ext.extend(PR.RequestListStore,Ext.ux.maximgb.treegrid.AdjacencyListStore,{
  initEvents: function() {
    PR.RequestListStore.superclass.initEvents.call(this);
    this.addEvents( 'delete' );
  }
});

/**
 * PR.ExpanderTemplate
 * @extends Ext.Template
 * To be used in RequestGrid Expander. It shows special
 * view for subrequests.
 */
PR.ExpanderTemplate = Ext.extend(Ext.Template,{
  compile: function() {
    if(!this.srTpl)
      this.srTpl = new Ext.Template('{subRequest}');
    this.srTpl.compile();
    if(!this.runTpl)
      this.runTpl = new Ext.Template(
	'<b>Author:</b> {reqAuthor}<br/>',
	'<b>Config:</b> {configName}/{configVersion} ',
	'<b>Processing pass:</b> {inProPass} ',
	'<b>File type:</b> {inFileType} ',
	'<b>DQ:</b> {inDataQualityFlag} ',
	'<b>Production:</b> {inProductionID}<br/>',
	'<b>Steps:</b> {pAll} <br/>'
      );
    this.runTpl.compile()
    return PR.ExpanderTemplate.superclass.compile.call(this);
  },
  apply: function(values) {
    if(values._parent){
      if(values.eventType || values.eventNumber) 
	return this.srTpl.apply({subRequest: 'Event type subrequest'});
      return this.srTpl.apply(values);
    } else if(values.reqType != 'Simulation')
      return this.runTpl.apply(values);
    return PR.ExpanderTemplate.superclass.apply.call(this,values);
  }
});


/**
 * PR.RequestGrid
 * @extends Ext.ux.maximgb.treegrid.GridPanel
 * This is a custom grid to display the list of Production Requests
 *
 * Refresh button is at some sence buggy: !!!
 *  it just redo the last load, independent from anything else...
 */
PR.RequestGrid = Ext.extend(Ext.ux.maximgb.treegrid.GridPanel, {
  // override
  initComponent: function() {
    var expander =  new Ext.grid.RowExpander({
      enableCaching: false, // both are required for
      lazyRender: false,    // proper update catch...
      tpl : new PR.ExpanderTemplate(
	'<b>Author:</b> {reqAuthor}<br/>',
	'<b>Beam:</b> {BeamCond} ',
	'<b>Beam energy:</b> {BeamEnergy} ',
	'<b>Generator:</b> {Generator} ',
	'<b>Magnetic field:</b> {MagneticField} ',
	'<b>Detector:</b> {DetectorCond} ',
	'<b>Luminosity:</b> {Luminosity}<br/>',
	'<b>Steps:</b> {pAll} <br/>'
      )
    });

    var store = new PR.RequestListStore();

    var pbOpts = {
      pageSize:    25,
      store:       store,
      displayInfo: true,
      displayMsg:  'Displaying requests {0} - {1} of {2}',
      emptyMsg:    'No requests are registered'
    };
    if(gPageDescription.userData.group == 'lhcb_user' ||
       gPageDescription.userData.group == 'user' ||
       gPageDescription.userData.group == 'lhcb')
      pbOpts.items = [ '-',
		       {text: 'New request', cls: 'x-btn-text', scope: this,
			handler: function() { this.fireEvent('newrequest'); } }
		     ]
    this.pagingBar = new Ext.ux.maximgb.treegrid.PagingToolbar(pbOpts);

    store.setDefaultSort('ID', 'DESC');
    store.load({params: {start:0, limit:this.pagingBar.pageSize}});

    Ext.apply(this, {
      root_title: 'Requests',
      master_column_id: 'Id',
      columns: [
	expander,
	{id: 'Id', header:'Id', sortable:true, dataIndex:'ID', width:40},
	{header:'Type',       sortable:true, dataIndex:'reqType',width:40},
	{header:'State',      sortable:true, dataIndex:'reqState',width:30},
	{header:'Priority',   sortable:true, dataIndex:'reqPrio',width:30},
	{header:'Name', sortable:true, dataIndex:'reqName'},
	{header:'Sim/Run conditions', sortable:true, dataIndex:'simDesc' },
	{header:'Proc. pass', sortable:true, dataIndex:'pDsc' },
	{header:'Event type', sortable:true, dataIndex:'eventType' },
	{header:'Events requested', sortable:true, dataIndex:'EventNumberTotal' },
	{header:'Events in BK', dataIndex:'eventBKTotal' },
	{header:'Progress (%)', dataIndex:'progress' },
	{header:'Created at',   dataIndex:'creationTime', hidden: true },
	{header:'Last state update', dataIndex:'lastUpdateTime', hidden:true },
	{header:'Author', dataIndex:'reqAuthor', hidden:true }
      ],
      autoHeight:    false,
      autoWidth:     true,
      collapsible:   false,
      labelAlign:    'left',
      loadMask:      true,
      margins:       '2 2 2 2',
      region:        'center',
      split:         true,
      store:         store,
      stripeRows:    true,
      title:         'Registered Production Requests',
      viewConfig:    {forceFit:true},
      plugins:       expander,
      bbar:          this.pagingBar
    });
    PR.RequestGrid.superclass.initComponent.call(this);
  },
  initEvents: function() {
    PR.RequestGrid.superclass.initEvents.call(this);
    this.addEvents( 'newrequest' );
  },
  refresh: function() {
    this.getStore().reload();
  }
});
Ext.reg('prlist', PR.RequestGrid);

/**
 * PR.RequestManager
 * @extend Ext.TabPanel
 * Custom TabPanel with all Production Requests operations
 */
PR.RequestManager = Ext.extend(Ext.TabPanel, {
  initComponent: function() {
    this.menu = new Ext.menu.Menu();
    this.grid = new PR.RequestGrid();
    Ext.apply(this, {
      items: [this.grid],
      activeTab:        0,
      enableTabScroll:  true,
      margins:          '2 0 2 0',
      region:           'center',
      layoutOnTabChange: true, // !!! BF: forms bug !!!
    });
    PR.RequestManager.superclass.initComponent.call(this);
  },

  initEvents: function() {
    PR.RequestManager.superclass.initEvents.call(this);
    this.grid.on('rowclick',this.onRowClick, this);
    this.grid.on('newrequest', this.newRequest, this);
  },

  // open menu on everything, EXCEPT some cells, so can't use CellClick
  // !! using undocumented GridView.findCellIndex
  onRowClick: function(grid, rowIdx, e) {
    var t = e.getTarget();
    var cell = grid.getView().findCellIndex(t);
    if(cell !== false && cell == 0)
      return; // expander column
    var r  = this.grid.getStore().getAt(rowIdx);
    var id = r.data.ID;
    this.menu.removeAll();
    var rm = this.getRecordMeta(r);
    this.menu.add( 
      {text: "Request "+id, disabled: true} , '-',
      {handler: function() {this.viewDetail(r)}, scope: this, text: 'View' },
      {handler: function() {this.viewWinDetail(r)}, 
       scope: this, text: 'Windowed view' },
      {handler: function() {this.viewHistory(r)},scope: this, text: 'History'}
    );
    if(rm.state=='New' && rm.author==rm.user){
      this.menu.add( 
	{handler: function() {this.viewEditor(r)}, scope: this, text: 'Edit' }
      );
    } else if( (rm.state=="BK Check"  && rm.group=="lhcb_bk") ||
	       (rm.state=="Submitted" && rm.group=="lhcb_ppg") ||
	       (rm.state=="Submitted" && rm.group=="lhcb_tech") ||
	       (rm.state=="Tech OK"   && rm.group=="lhcb_ppg") ||
	       (rm.state=="PPG OK"    && rm.group=="lhcb_tech")) {
      this.menu.add( 
	{handler: function() {this.viewEditor(r)}, scope: this, text: 'Sign' }
      );
    } else if( (rm.state=="Accepted" || rm.state=="Active") && rm.group=="lhcb_prmgr" )
      this.menu.add( 
	{handler: function() {this.viewEditor(r)}, scope: this, text: 'Edit' }
      );
    else if(rm.state=="Rejected" && rm.user == rm.author)
      this.menu.add( 
	{handler: function() {this.resurrect(r)}, scope: this, text: 'Resurrect' }
      );
    else if(rm.state=="BK OK" && rm.user==rm.author)
      this.menu.add( 
	{handler: function() {this.viewEditor(r)}, scope: this, text: 'Confirm' }
      );


    if(rm.author != 'Anonymous')
      this.menu.add(
	'-',
	{handler: function() {this.duplicate(r)}, scope: this, text: 'Duplicate' }
      );
    if(((rm.state == 'New' || rm.state == 'Rejected') && rm.author==rm.user) ||
       rm.group == 'diracAdmin')
      this.menu.add(
	{handler: function() {this.delRequest(r)}, scope: this, text: 'Delete'}
      );
    if(rm.state=='New' && !r.data._master && r.data.reqType == 'Simulation')
      this.menu.add(
	'-',
	{handler: function() {this.addSubRequests(r);}, 
	 scope: this, text: 'Add subrequest'}
      );
    if(rm.state=='Active' || rm.state=='Accepted' || rm.state=='Done')
      this.menu.add(
	'-',
	{handler: function() {this.manageProductions(r);},
	 scope: this, text: 'Productions'}
      );
    this.menu.showAt(Ext.EventObject.xy);
  },

  viewBkkBrowser: function(r) {
    var browser = new PR.BkSimCondBrowser();
    browser.show();
  },

  getMasterStateAndAuthor: function(r){
    if(!r.data._master)
      return { state:r.data.reqState, author:r.data.reqAuthor };
    rmaster = this.grid.getStore().getById(r.data._master);
    if(rmaster)
      return { state:rmaster.data.reqState, author:rmaster.data.reqAuthor };
    return {state:"Unknown",author:"Unknown"}
  },

  getRecordMeta : function(r){
    var m = this.getMasterStateAndAuthor(r)
    m.user  = gPageDescription.userData.username;
    m.group = gPageDescription.userData.group;
    return m;
  },

  newRequest: function() {
    var tw = new PR.ReqType();
    tw.on('create', function(type) {
      this.viewEditor(null,type);
    },this);
    tw.show();
  },

  viewEditor: function(r,type) {
    if(r && r.data._master){
      this.editSubRequest(r);
      return;
    }
    var title = 'New request';
    var state = 'New';
    var meta  = null;
    if(r)
      type = r.data.reqType;
    if(r && r.data.ID){
      title = 'Edit request '+r.data.ID;
      state = r.data.reqState;
      meta = this.getRecordMeta(r)
    }
    var editor = new PR.RequestEditor({
      title:    title,
      closable: true,
      state: state,
      type: type
    });
    editor.on('saved', function(){
      this.getStore().setActiveNode(null);
      this.getStore().load({params: {start:0, limit:this.pagingBar.pageSize},
			    add: true});
    }, this.grid);
    if(r && r.data.ID){
      editor.rID = r.data.ID
      this.grid.getStore().on('delete', function(id) {
	if(this.rID == id)
	  this.onCancel();
      }, editor);
    }
    this.add(editor).show();
    editor.loadRecord(meta,r);
  },

  viewDetail: function(r) {
    var title = 'Request ';
    if(r.data._master)
      title = 'Subrequest ';
    var tabs = this.find('title',title+r.data.ID);
    if( tabs.length ){
      this.setActiveTab( tabs[0] );
      return;
    }
    var detail = new PR.RequestDetail({
      title:    title+r.data.ID,
      ID:       r.data.ID,
      autoScroll: true,
      closable: true
    });
    this.grid.getStore().on('datachanged', 
			    detail.onDataChanged, 
			    detail);
    this.add(detail).show();
    if(r.data._master){
      detail.IDs = this._getSubRequestPath(r.data.ID);
      detail.onDataChanged(this.grid.getStore());
      this.grid.getStore().on('delete', function(id) {
	for(i=0;i<this.IDs.length;++i)
	  if(this.IDs[i] == id){
	    if(this.ownerCt)
	      this.ownerCt.remove(this);
	    break;
	  }
      }, detail);
    } else {
      this.grid.getStore().on('delete', function(id) {
	if(this.ID == id)
	  this.ownerCt.remove(this);
      }, detail);
      detail.updateDetail(r.data);
    }
  },

  viewWinDetail: function(r) {
    var title = 'Request ';
    if(r.data._master)
      title = 'Subrequest ';
    var wins = Ext.WindowMgr.getBy(function(win){
      if(win.title==title+r.data.ID)
	return true;
      return false;
    });
    if(wins.length){
      wins[0].show();
      return;
    }
    var detail = new PR.RequestDetail({ID: r.data.ID});
    this.grid.getStore().on('datachanged', detail.onDataChanged, detail);
    var win = new Ext.Window({
      title:    title+r.data.ID,      
      items: detail,
      rID: r.data.ID
    });
    win.show();
    if(r.data._master){
      detail.IDs = this._getSubRequestPath(r.data.ID);
      win.rIDs = detail.IDs;
      detail.onDataChanged(this.grid.getStore());
      this.grid.getStore().on('delete', function(id) {
	for(i=0;i<this.rIDs.length;++i)
	  if(this.rIDs[i] == id){
	    this.close();
	    break;
	  }
      }, win);
    } else {
      this.grid.getStore().on('delete', function(id) {
	if(this.rID == id)
	  this.close();
      }, win);
      detail.updateDetail(r.data);
    }
  },

  copyRequest: function(r) {
    var rc = r.copy();
    delete rc.data.ID;
    this.viewEditor(rc);
  },

  __realDelRequest: function(id) {
    var conn = new Ext.data.Connection();
    conn.request({
      url: 'delete',
      method: 'GET',
      params: {'ID': id},
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Delete request fail',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	this.grid.getStore().setActiveNode(null);
	this.grid.getStore().load({
	  params: {start:0, limit:this.grid.pagingBar.pageSize},
	  add: true});
	this.grid.refresh();
	this.grid.getStore().fireEvent('delete',id);
      },
      failure: connectBugger('Delete Request')
    });
  },

  delRequest: function(r) {
    var id = r.data.ID;
    Ext.MessageBox.confirm('Message', 
			   'Do you really want to delete Request '+id+'?',
			   function(btn){
			     if(btn == 'yes')
			       this.__realDelRequest(id)
			   }, this);
  },

  _getSubRequestPath : function(parent) {
    var path = [];
    while(parent){
      path.push(parent);
      parent = this.grid.getStore().getById(parent).data;
      if(!parent._master)
	break
      parent = parent._parent;
    }
    return path;
  },

  resurrect: function(r) {
    var conn = new Ext.data.Connection();
    conn.request({
      url: 'save',
      method: 'POST',
      params: { ID: r.data.ID, reqState: 'New' },
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Resurrecting has failed',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	this.grid.getStore().setActiveNode(null);
	this.grid.getStore().load({
	  params: {start:0, limit:this.grid.pagingBar.pageSize},
	  add: true});
	this.grid.refresh();
      },
      failure: connectBugger('Resurrect Request')
    });
  },

  duplicate: function(r) {
    var conn = new Ext.data.Connection();
    conn.request({
      url: 'duplicate',
      method: 'GET',
      params: { ID: r.data.ID },
      scope: this,
      success: function(response){
	if (response) { // check that it is really OK... AZ: !! ??
	  var str = '';
	  try {
	    var result = Ext.decode(response.responseText);
	    if ( !result.OK )
              str = result.Message;
	  } catch (e2) {
	    str = "unparsable reply from the portal: "+e2.message;
	  }
	  if(str){
	    Ext.MessageBox.show({
	      title: 'Duplicate has failed',
	      msg: str,
	      buttons: Ext.MessageBox.OK,
	      icon: Ext.MessageBox.ERROR
	    });
	    return;
	  }
	}
	Ext.MessageBox.show({
	  title: 'Request was successfully duplicated',
	  msg: 'New Request ID: '+result.Value,
	  buttons: Ext.MessageBox.OK,
	  icon: Ext.MessageBox.INFO
	});

	this.grid.getStore().setActiveNode(null);
	this.grid.getStore().load({
	  params: {start:0, limit:this.grid.pagingBar.pageSize},
	  add: true});
	this.grid.refresh();
      },
      failure: connectBugger('Duplicate Request')
    });
  },

  addSubRequests : function(r) {
    var adder = new PR.SubRequestAdder({
      title: 'Add subrequests to '+r.data.ID,
      data: r.data
    });
    adder.on('saved', function(){
      this.getStore().setActiveNode(null);
      this.getStore().load({params: {start:0, limit:this.pagingBar.pageSize},
			    add: true});
    }, this.grid);
    adder.show();
  },

  addSubRequest : function(r) {
    var editor = new PR.SubRequestEditor({
      title:    'New subrequest',
      closable: true,
    });
    var path = this._getSubRequestPath(r.data.ID);
    editor.Original.IDs = path;
    this.grid.getStore().on('datachanged', 
			    editor.Original.onDataChanged, 
			    editor.Original);

    editor.on('saved', function(){
      this.getStore().setActiveNode(null);
      this.getStore().load({params: {start:0, limit:this.pagingBar.pageSize},
			    add: true});
    }, this.grid);
    editor.parentPath = path;
    this.grid.getStore().on('delete', function(id) {
      for(var i=0;i<this.parentPath.length;++i)
	if(this.parentPath[i] == id){
	  this.onCancel();
	  break;
	}
    }, editor);
    this.add(editor).show();
    editor.loadRecord(null,false);
    editor.Original.onDataChanged(this.grid.getStore());
  },

  editSubRequest : function(r) {
    var title = 'New subrequest';
    if(r.data.ID)
      title = 'Edit subrequest '+r.data.ID;
    var editor = new PR.SubRequestEditor({
      title:    title,
      closable: true,
    });
    var path = this._getSubRequestPath(r.data._parent);
    editor.Original.IDs = path;
    this.grid.getStore().on('datachanged', 
			    editor.Original.onDataChanged, 
			    editor.Original);

    editor.on('saved', function(){
      this.getStore().setActiveNode(null);
      this.getStore().load({params: {start:0, limit:this.pagingBar.pageSize},
			    add: true});
    }, this.grid);
    editor.parentPath = path;
    this.grid.getStore().on('delete', function(id) {
      for(var i=0;i<this.parentPath.length;++i)
	if(this.parentPath[i] == id){
	  this.onCancel();
	  break;
	}
    }, editor);
    this.add(editor).show();

    setro = false;
    if(this.getMasterStateAndAuthor(r).state!='New')
      setro = true;
    editor.loadRecord(r,setro);
    editor.Original.onDataChanged(this.grid.getStore());
  },

  manageProductions: function(r){
    var win = new PR.ProductionManager({
      title: "Manage productions for request "+r.data.ID,
      rID: r.data.ID
    });
    win.on('saved', function(){
      this.getStore().setActiveNode(null);
      this.getStore().load({params: {start:0, limit:this.pagingBar.pageSize},
			    add: true});
    }, this.grid);
    win.show();
  },

  viewHistory: function(r){
    var win = new PR.HistoryViewer({
      title: "History for request "+r.data.ID,
      rID: r.data.ID
    });
    win.show();
  }
});
Ext.reg('prmanager', PR.RequestManager);

/*
"ID": 1,
"reqName": "Kuku",
"reqType": "Simulation"
"reqState": "New", 
"reqPrio": "2b", 
"reqAuthor": "Alexey Zhelezov", 
"reqPDG": "(not confirmed)", 

"simCondID": "1578", 
"simDesc": "Beam5TeV-VeloOpen-BfieldNeg", 
"Generator": "Pythia", 
"MagneticField": "-1", 
"BeamEnergy": "5 TeV", 
"Luminosity": "Fixed 2 10**32", 
"DetectorCond": "VeloOpen", 
"BeamCond": "Collisions", 

"pID": "Pass132515", 
"pDsc": "DC06-Sim", 
"p1CDb": "v30r8", 
"p1App": "Boole", 
"p1Ver": "v12r1", 
"p1Opt": "Gauss", 
"p1DDDb": "v25r0", 

"eventType": "11102021", 
"eventNumber": "1212", 

"reqComment": ""
"reqDesc": ""
*/
