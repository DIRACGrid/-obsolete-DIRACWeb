
def dropDownMenu( menuId, selectedOption, optionsList ):
  htmlText = "<a id='menu%sWidgetTrigger' href='#'>%s</a><span id='menu%sWidgetPosition'/>\n" % ( menuId, selectedOption, menuId )
  if optionsList:
    htmlText += "<script type='text/javascript'>\n"
    htmlText += " function initMenu%s() {\n" % menuId
    htmlText += " var %sMenuList = [" % menuId
    for optionTuple in optionsList:
      htmlText += "{ text : '%s', url : '%s' }," % optionTuple
    htmlText += " ];\n"
    htmlText += "  var o%sMenuWidget = new YAHOO.widget.Menu( 'menu%sWidget' );\n" % ( menuId, menuId )
    htmlText += "  o%sMenuWidget.addItems( %sMenuList );\n" % ( menuId, menuId )
    htmlText += "  o%sMenuWidget.render( 'menu%sWidgetPosition' );\n" % ( menuId, menuId )
    htmlText += "  function show%sMenuWidget( e ) {\n" % menuId
    htmlText += "    o%sMenuWidget.cfg.setProperty( 'x', YAHOO.util.Dom.getX( 'menu%sWidgetTrigger' ) );\n" % ( menuId, menuId )
    htmlText += "    o%sMenuWidget.cfg.setProperty( 'y', YAHOO.util.Dom.getY( 'menu%sWidgetTrigger' ) + YAHOO.util.Dom.get( 'menu%sWidgetTrigger' ).offsetHeight );\n" % ( menuId, menuId, menuId )
    htmlText += "    o%sMenuWidget.show();\n" % menuId
    htmlText += "  }\n"
    htmlText += "  YAHOO.util.Event.addListener( document.getElementById('menu%sWidgetTrigger'), 'click', show%sMenuWidget);\n" % ( menuId, menuId )
    htmlText += " }\n"
    #htmlText += "YAHOO.util.Event.addListener(window, 'load', initMenu%s );\n" % id
    htmlText += "YAHOO.util.Event.onDOMReady( initMenu%s );\n" % menuId
    htmlText += "</script>"
    return htmlText
