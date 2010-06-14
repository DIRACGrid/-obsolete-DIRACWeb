
var nsParts = [ 'DEncode' ];
var root = window;
for( var i = 0; i< nsParts.length; i++ )
{
 if( typeof root[ nsParts[i] ] == "undefined" )
  root[ nsParts[i] ] = new Object();
  root = root[ nsParts[i] ];
}

DEncode.debugEnabled = false;
DEncode.g_dEncodeFunctions = {};
DEncode.g_dDecodeFunctions = {};

//Encoding and decoding ints
DEncode.encodeInt = function( iValue )
{
  return "i" + String( iValue ) + "e";
}

DEncode.dencodeInt = function( buffer, i )
{
  DEncode.debug( "decoding int" );
  i += 1;
  var end  = buffer.indexOf( 'e', i );
  var n = parseInt( buffer.substring( i, end ) );
  return [ n, end + 1 ];
}

DEncode.g_dEncodeFunctions[ 'int' ] = DEncode.encodeInt;
DEncode.g_dDecodeFunctions[ "i" ] = DEncode.dencodeInt;

//Encoding and decoding strings
DEncode.encodeString = function( sValue, eList )
{
  return 's' + String( sValue.length ) + ':' + sValue;
}

DEncode.decodeString = function( buffer, i )
{
  DEncode.debug( "decoding string" );
  i += 1;
  var colon = buffer.indexOf( ":", i );
  var n = parseInt( buffer.substring( i, colon ) );
  colon += 1;
  var end = colon + n;
  return [ buffer.substring( colon, end ) , end ];
}

DEncode.g_dEncodeFunctions[ 'string' ] = DEncode.encodeString;
DEncode.g_dDecodeFunctions[ "s" ] = DEncode.decodeString;

//Encode and decode a list
DEncode.encodeList = function( lValue )
{
  var eList = [ "l" ];
  for( var i = 0; i < lValue.length; i++ )
    eList.push( DEncode.encode( object ) );
  eList.push( "e" );
  return eList.join("");
}

DEncode.decodeList = function( buffer, i )
{
  DEncode.debug( "decoding list" );
  var oL = [];
  i += 1
  while( buffer[ i ] != "e" )
  {
	DEncode.debug( buffer[i] );
    var res = DEncode.g_dDecodeFunctions[ buffer[ i ] ]( buffer, i );
    var ob = res[0];
    i = res[1];
    oL.push( ob );
  }
  return [ oL, i + 1 ];
}

DEncode.g_dEncodeFunctions[ 'list' ] = DEncode.encodeList;
DEncode.g_dDecodeFunctions[ "l" ] = DEncode.decodeList;

//Encode and decode a dictionary
DEncode.encodeDict = function( dValue, eList )
{
  var eList = [ "d" ];
  for( key in  dValue )
  {
    eList.push( DEncode.encode( key ) );
    eList.push( DEncode.encode( dValue[ key ] ) );
  }
  eList.push( "e" );
  return eList.join("");
}

DEncode.decodeDict = function( buffer, i )
{
  DEncode.debug( "Decoding dict" );
  var oD = {};
  i += 1;
  while( buffer[ i ] != "e" )
  {
	DEncode.debug( " dict key is [" + buffer[i] +"]" );
    var res = DEncode.g_dDecodeFunctions[ buffer[ i ] ]( buffer, i );
    var k = res[0];
    i = res[1];
    DEncode.debug( " dict value is [" + buffer[i] +"]" );
    res = DEncode.g_dDecodeFunctions[ buffer[ i ] ]( buffer, i );
    oD[ k ] = res[0];
    i = res[1];
  }
  return [ oD, i + 1 ];
}

DEncode.g_dEncodeFunctions[ 'dict' ] = DEncode.encodeDict;
DEncode.g_dDecodeFunctions[ "d" ] = DEncode.decodeDict;

DEncode.encode = function( uObject )
{
	if( typeof uObject == "number" )
		return DEncode.g_dEncodeFunctions[ 'int' ]( uObject );
	//For firefox encode deterministically with toSource function
	if( uObject.toSource )
	{
		var source = uObject.toSource();
		if( source.indexOf( "([" ) == 0 )
			return DEncode.g_dEncodeFunctions[ 'list' ]( uObject );
		if( source.indexOf( "({" ) == 0 )
			return DEncode.g_dEncodeFunctions[ 'dict' ]( uObject );
		if( source.indexOf( "(new String" ) == 0 )
			return DEncode.g_dEncodeFunctions[ 'string' ]( uObject );
	}
	//For the rest do a loose dirty match hack because they don't support
	//standards
	else
	{
		if( uObject.charAt )
			return DEncode.g_dEncodeFunctions[ 'string' ]( uObject );
		if( typeof uObject.length == "number" )
			return DEncode.g_dEncodeFunctions[ 'list' ]( uObject );
		return DEncode.g_dEncodeFunctions[ 'dict' ]( uObject );
	}
	alert( "Unknown object " + uObject + " source: " + source );
}

DEncode.decode = function( stub )
{
	DEncode.debug( "Starting decoding with " + stub.charAt( 0 ) )
	var res = DEncode.g_dDecodeFunctions[ stub.charAt( 0 ) ]( stub, 0 );
	return res[0];
}

DEncode.debug = function( msg )
{
	if( DEncode.debugEnabled )
	{
		console.log( "[DEncode] " + msg );
	}
}