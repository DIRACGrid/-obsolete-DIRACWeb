# -*- coding: utf-8 -*-
<%inherit file="/diracPage4.mako" />

<%def name="head_tags()">
 
<script type="text/javascript">

function initTestPage(){
  Ext.require('Ext.panel.Panel');
  Ext.require('Ext.toolbar.TextItem');
  Ext.require('Ext.container.Viewport');
  Ext.require('Ext.button.Split');
  Ext.require('Ext.layout.container.Border');
  Ext.onReady(function(){
    renderPage();
  });
}

function renderPage()
{
  var mainPanel = Ext.create( 'Ext.panel.Panel', {
    title : 'Hello Ext4',
    region : 'center'
    } );
   console.log( "HLLO" );
  renderInMainViewport( [ mainPanel ] );
}

</script>
 
</%def>


<%def name='body()'>

<script type="text/javascript">
   initTestPage();
</script>
  
</%def>
