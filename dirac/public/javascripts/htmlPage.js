gMainPanel = false;

function initHTML( htmlID ){
  Ext.onReady(function(){
    renderPage( htmlID );
  });
}

function renderPage( htmlID )
{
  var rawEl = Ext.get( htmlID );
  if( !rawEl )
  {
  	alert( "Can't get element " + htmlID );
  }

  gMainPanel = new Ext.Panel( {
  							region : 'center',
							autoScroll : true,
  							enableTabScroll : true,
  							defaults: { autoScroll:true },
  							contentEl : htmlID,
//  							items : [ rawEl ],
  							 } );
  //rawEl.remove();

  renderInMainViewport( [ gMainPanel ] );
}
