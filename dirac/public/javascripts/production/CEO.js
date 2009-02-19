/** Cascaded Execution Objects (CEO) library
 * 
 *  This is simplication of the Workflow concept (but more general).
 *  
 *  CEO::Class:
 *    Defines fixed set of attributes, list of arbitrary parameters
 *    and ordered list of children objects. Parameter values
 *    are not used (except as default values in editor).
 *    
 *  CEO::Object:
 *    Realization of CEM::Class. Objects exist only inside the list
 *    of some class (so, they can't be stand alone), except toplevel
 *    object. Objects define parameters values.
 *    
 *  Object parameter values can be direct or pointers to either parameter
 *  in the class where the object is defined (parent parameter) or to
 *  one of object parameters defined in the ordered object list prior this object.
 *  (neighbour parameter). Future version may avoid neighbour pointer.
 *    
 *  One and only one object is Toplevel object. Since it is not in
 *  class list, it can have only direct parameter values.
 *  
 *  If class has body, it is execution class (leaf). It can't have object
 *  list (currently).
 * 
 ****
 *  Backward compatibility with workflow library:
 *    Workflow (instance) is maped to Toplevel object and it's class,
 *       and this class can have only not execution classes objects it it's list.
 *    Module is execution class.
 *    Step is any other class. They can have only execution classes objects in the list.
 */

function clone (deep) {
  var objectClone = new this.constructor();
  for (var property in this)
    if (deep && typeof this[property] == 'object')
      objectClone[property] = this[property].clone(deep);
	else
      objectClone[property] = this[property];
  return objectClone;
}
Object.prototype.clone = clone;

var CEO = new function(){
	// private:

	this.utils = new function(){
		this.list2dict = function ( id,plist ){
			var result = {};
			if (plist) {
				for (var i = 0; i < plist.length; ++i) 
					result[plist[i][id]] = plist[i];
			}
			return result;
		}
	}

	this.getChanges = function(ddict,sdict,protect) {
		var pdict={};
		if (protect) {
			for (var i = 0; i < protect.length; ++i) 
				pdict[protect[i]] = null;
		}
		var udict = {};
		for (var i in sdict)
			if (typeof sdict[i] != 'function' && ddict[i] != undefined && sdict[i] != ddict[i]) {
				if (pdict[i] != undefined) {
					this.error("CEO:BUG:getChanges: " + i + " is in protection list");
					return undefined;
				}
				udict[i] = sdict[i];
			}
		return udict;
	}

	this.applyChanges = function(ddict, sdict){
		for (var i in sdict) 
			if (ddict[i] != undefined && typeof sdict[i] != 'function') 
				ddict[i] = sdict[i];
	}

	this.links = new function () {
		this.types = { "":"", Up:"", To:"", Ne:"", UpS:"", ToS:"", ToF:"", ToFS:"" };
		this.WFPossibleTypes = {
			TopLevel: [], Step: [ "","To","ToS","Ne" ], StepDef: [ "","To", "ToS" ],
			Mod: ["","Up","UpS","To","Ne","ToS","ToF","ToFS"], ModDef: [ "","Up", "UpS", "To", "ToS", "ToF", "ToFS" ]
		};
		this.WFTranslate = {
			TopLevel: { "":"No" },
			Step: { "":"No", To:"to workflow", Ne:"to previous step", ToS:"to workflow with step separation" },
			Mod:  { "":"No", Up:"to step", To:"to workflow", Ne:"to previous module", 
					UpS:"to step with module separation",ToS:"to workflow with step separation",ToF:"to workflow with module separation", ToFS:"to workflow with module and step separation"},
		};
		this.WFTranslate.StepDef = this.WFTranslate.Step;
		this.WFTranslate.ModDef = this.WFTranslate.Mod;
	}
	
	// class ParList
	this.ParList = function () {
		this.parList = function () {
			var result = [];
			for(var i in this.parameters)
				if(typeof this.parameters[i] != 'function')
					result.push(this.parameters[i]);
			return result;
		}
		this.parNames = function () {
			var result = [];
			for(var i in this.parameters)
				if(typeof this.parameters[i] != 'function')
					result.push(this.parameters[i].Name);
			return result;			
		}
		this.parCount = function () { this.parList().length; }
		this.WFType = function () {
			if(this.isTopLevel())
				return "TopLevel";
			if(this.isExe()){
				if(this.isKlass)
					return "ModDef";
				return "Mod"
			}
			if(this.isKlass)
				return "StepDef";
			return "Step";
		}
		this.LType = function (par) {
			if(!par || !par.LinkedModule || this.isTopLevel())
				return "";
			var wftype = this.WFType();
			var type = par.LinkedModule;
			if(type == 'self') {
				if(par.LinkedParameter == this.Label()+'_'+par.Name)
					type = CEO.links.WFPossibleTypes[wftype][2];
				else
					type = CEO.links.WFPossibleTypes[wftype][1];
			}
			if(CEO.links.types[type] == undefined){
				if(!this.isKlass)
					return "Ne";
				return "";
			}
			return type;
		}
		this.nextLType = function (ltype) {
			if(ltype == 'ToF')
				ltype = 'To';
			if(ltype == 'ToFS')
				ltype = 'ToS';
			if(this.isTopLevel() || ltype.slice(0,2)!= 'To')
				return '';
			return ltype;
		}
		
		this.LTypes = function(){ 
			var ltypes = CEO.links.WFPossibleTypes[this.WFType()]; 
			var result = [];
			for (var i = 0; i < ltypes.length; ++i) {
				if(ltypes[i] == 'Ne' && !this.getPrevNeighbours().length)
					continue;
				result.push(ltypes[i]);
			}
			return result;
		}
		this.WFLType = function (par) { return CEO.links.WFTranslate[this.WFType()][this.LType(par)];	}
		this.WFLTypes = function () {
			var wftype = this.WFType();
			var ltypes = this.LTypes();
			var result = [];
			for (var i = 0; i < ltypes.length; ++i)
				result.push(CEO.links.WFTranslate[wftype][ltypes[i]]);
			return result;
		}
		this.defParLinkName = function(ltype,name) {
			if(this.isKlass)
				return name;
			if(ltype == "UpS" || ltype == "ToFS" || ltype == "ToF")
				return this.Name+'_'+name;
			if(ltype == "ToS" && this.parent.isTopLevel())
				return this.Name+'_'+name;
			return name;
		}

		this.parNameChangeOne = function( prlist) {
			if(!prlist.length)
				return;
			var cur = prlist.shift();
			if(cur.it.isKlass){
				if(cur.it.parameters[cur.newname]){ // new parameter is already there
					if(!cur.it.removeParameter(cur.oldname,true))
						cur.it.updateParDirection(cur.oldname);
					return;
				}
				var links = cur.it.linkedFrom(cur.oldname,true);
				if(links.length) { // can't change name
					cur.it.updateParDirection(cur.oldname);
					var par = new CEO.Par(cur.it.parameters[cur.oldname]);
					par.Name = cur.newname;
					if(par.LinkedParameter == cur.oldname)
						par.LinkedParameter = cur.newname;
					cur.it.addPar(par);
				} else { // can change name
					var par = cur.it.parameters[cur.oldname];
					par.Name = cur.newname;
					if(par.LinkedParameter == cur.oldname)
						par.LinkedParameter = cur.newname;
					cur.it.parameters[par.Name] = par;
					delete cur.it.parameters[cur.oldname];
					var used=cur.it.usedBy();
					for(var i=0;i<used.length;++i)
						prlist.push({ it:used[i], oldname:cur.oldname, newname:cur.newname });
				}
			} else {
				var par = cur.it.parameters[cur.oldname];
				par.Name = cur.newname;
				if(par.LinkedModule == 'self') {
					var oldlink = par.LinkedParameter;
					if(oldlink == cur.oldname)
						par.LinkedParameter = cur.newname;
					else if(oldlink == cur.it.Name+'_'+cur.oldname)
						par.LinkedParameter = cur.it.Name+'_'+cur.newname;
					if(par.LinkedParameter != oldlink)
						prlist.push({ it:cur.it.parent, oldname:oldlink, newname:par.LinkedParameter});
				}
				cur.it.parameters[par.Name] = par;
				delete cur.it.parameters[cur.oldname];
				var links = cur.it.getNeighboursLinks(cur.oldname);
				for (var i = 0; i < links.length; ++i) 
					links[i].it.parameters[links[i].parname].LinkedParameter = par.Name;
			}
		}

		this.parNameChange = function(prlist){
			while (prlist.length) 
				this.parNameChangeOne(prlist);
		}

		this.toWF = function () {
			var alist = [ "Name", "Type", "DescrShort", "Description", "Origin", "Version", "Body" ];
			var ret = {};
			for(var i=0;i<alist.length;++i)
				if(this[alist[i]] != undefined)
					ret[alist[i]] = this[alist[i]];
			var par = [];
			var pl = this.parList();
			for(var i=0;i<pl.length;++i)
				par.push( { Name:pl[i].Name, Type:pl[i].Type, LinkedModule:pl[i].LinkedModule,
										LinkedParameter:pl[i].LinkedParameter,In:(pl[i].In?"True":"False"),
										Out:(pl[i].Out?"True":"False"),Description:pl[i].Description,Value:pl[i].Value });
			ret.parameters = par;
			return ret;
		}
	}
	// class Class ctor
	this.Klass = function (kdict) {
		var attrib = [ "Type", "DescrShort", "Description", "Origin", "Version"]
		for(var i=0;i<attrib.length;i++)
			this[attrib[i]] =  (kdict[attrib[i]] == undefined)?'':kdict[attrib[i]]; 
		if(kdict.Body!=undefined)
			this.Body = kdict.Body;
		if(kdict.Required!=undefined)
			this.Required = kdict.Required;
		this.parameters = {};
		this.obj = [];
		
		this.addPar = function (pdict,ltype) {
			var par = new CEO.Par(pdict);
			if(!par.Name)
				return CEO.error("Parameter must have not empty name ");
			if(this.parameters[par.Name])
				return CEO.error("Parameter '"+par.Name+"' already exist");
			if(par.LinkedModule!='self' && CEO.links.types[par.LinkedModule] == undefined){
				par.LinkedModule='';
				par.LinkedParameter='';
			}
			if (par.LinkedModule && ltype!=undefined) {
				par.LinkedModule = ltype;
			}
			if (!par.LinkedModule)
				par.LinkedParameter = '';
			this.parameters[par.Name] = par;
			var ulist = this.usedBy();
			for(var i=0;i<ulist.length;++i)
				ulist[i].addPar(par);
			return true;
		}

		this.updatePar = function (par,pdict,ltype) {
			var udict = CEO.getChanges(par,pdict);
			if(udict == undefined)
				return false;
			if(udict.Name != undefined) { // Only name must be checked
				if(!udict.Name)
					return CEO.error("Parameter must have not empty name ");
				if(this.parameters[udict.Name])
					return CEO.error("Parameter '"+udict.Name+"' already exist");
				var links = this.linkedFrom(par.Name,true);
				for (var i = 0; i < links.length; ++i) 
					links[i].it.parameters[links[i].parname].LinkedParameter = udict.Name;
				this.parNameChange([ { it: this, oldname: par.Name, newname: udict.Name } ])
			}
			CEO.applyChanges(par,udict);
			if(udict.In != undefined || udict.Out != undefined)
				this.propagateParDirection(par);
			return true;
		} 
		
		this.linkValid = function (objname,parname,srcobj) {
			if(!objname || objname == 'self')
				return true;
			for(var i=0;i<this.obj.length && this.obj[i]!=srcobj;++i)
				if(this.obj[i].Name == objname)
					return this.obj[i].parameters[parname] != undefined;
			return false;
		}
		
		// Append a object of specified class. Return created object on success
		// In case parameter list is specified, set parameters values from it
		this.addObj = function ( name, kname, descr, plist ) {
			var klass = CEO.klass[kname];
			if(!name)
				return CEO.error("Name can't be void")
			if(!klass)
				return CEO.error("Type '"+kname+"' is not defined");
			for(var i=0;i<this.obj.length;i++)
				if(this.obj[i].Name == name)
					return CEO.error("'"+name+"' already exist");
			var obj = new CEO.Obj(name,klass,descr);
			obj.parent = this;
			this.obj.push(obj);
			var kplist=klass.parList();
			var pdict=CEO.utils.list2dict('Name',plist);
			for(var i=0;i<kplist.length;++i){
				var par = new CEO.Par(kplist[i]);
				var spar = pdict[par.Name];
				if (spar) {
					if(!this.linkValid(spar.LinkedModule,spar.LinkedParameter))
						CEO.error("'"+name+"' has invalid neighbour link to '"+spar.LinkedModule+'.'+spar.LinkedParameter+"'. Ignored.");
					else
						par.setValue(spar);
				}
				obj.addPar(par);
			}
			return obj;
		}
		
		this.getObjIdx = function ( obj ){
			var n=0;
			for(;n<this.obj.length;++n)
				if(obj==this.obj[n])
					break;
			return n;
		}
		
		this.moveUp = function ( obj ){
			var n=this.getObjIdx(obj);
			if(n==this.obj.length || !n)
				return false;
			var tmp = this.obj[n-1];
			if (obj.isLinkedToNeighbour(tmp.Name))
				return CEO.warn("Can't move due to link(s) to " + tmp.Name);
			this.obj[n-1] = obj;
			this.obj[n] = tmp;
			return true;
		}

		this.moveDown = function ( obj ){
			var n=this.getObjIdx(obj);
			if(n>=this.obj.length-1)
				return false;
			var tmp = this.obj[n+1];
			if (tmp.isLinkedToNeighbour(obj.Name))
				return CEO.warn("Can't move due to link(s) from " + tmp.Name);
			this.obj[n+1] = obj;
			this.obj[n] = tmp;
			return true;
		}
		
		this.usedBy = function ( ){
			var result = [];
			for(var k in CEO.klass) {
				var klass = CEO.klass[k];
				if(typeof klass == 'function' || klass == this )
					continue;
				for (var i = 0; i < klass.obj.length; ++i) {
					if (klass.obj[i].Type == this.Type) 
						result.push(klass.obj[i]);
				}
			}
			if(CEO.topLevel && CEO.topLevel.Type == this.Type)
				result.push(CEO.topLevel);
			return result;
		}
		
		// public:
		this.Label = function () { return this.Type; }
		this.isTopLevel = function () { return CEO.topLevel?(this.Type==CEO.topLevel.Type):false; }
		this.isExe = function() { return this.Body!=undefined; }
		this.isKlass = true;

		this.update = function ( cdict ){
			if(cdict.obj != undefined || cdict.Parameters != undefined)
				return CEO.error("CEO: can't modify klass parameters or object list")
			if(cdict.Type != undefined){
				if(!cdict.Type)
					return CEO.warn("Type can't be void")
				if(CEO.klass[cdict.Type] != undefined)
					return CEO.warn("'"+cdict.Type+"' already exist");
				delete CEO.klass[this.Type];
				CEO.klass[cdict.Type] = this;
				var used = this.usedBy();
				for(var i=0;i<used.length;++i)
					used[i].Type = cdict.Type;
			}
			CEO.applyChanges(this,cdict);
			return true;
		}
		
		this.linkedFrom = function ( name, children_only ) {
			var result = [];
			for(var i=0;i<this.obj.length;++i){
				for(var j in this.obj[i].parameters){
					var p = this.obj[i].parameters[j];
					if(typeof p != 'function' && p.LinkedModule == 'self' && p.LinkedParameter == name)
						result.push({it:this.obj[i], parname:p.Name});
				}
			}
			if(children_only)
				return result;
			var olist = this.usedBy();
			for(var i=0;i<olist.length;++i){
				var nlist = olist[i].getNeighboursLinks( name ); 
				for(var j=0;j<nlist.length;++j)
					result.push(nlist[j]);
			}
			return result;
		}
		
		this.removeParameter = function ( name , silent) {
			var links = this.linkedFrom( name );
			if(links.length){
				if(!silent)
					return CEO.warn("This parameter is linked from "+links[0].it.Label()+' ('+links[0].parname+')')
				return false;
			}
			
			var olist = this.usedBy();
			delete this.parameters[name];
			for(var i=0;i<olist.length;++i)
				olist[i].propagateRemoveParameter(name);
			return true;
		}
		
		this.parOrigins = function (name) {
			var result = [];
			for(var i=0;i<this.obj.length;++i){
				for(var j in this.obj[i].parameters){
					var p = this.obj[i].parameters[j];
					if(typeof p != 'function' && p.LinkedModule == 'self' && p.LinkedParameter == name)
						result = result.concat(this.obj[i].getKlass().parOrigins(p.Name))
				}
			}
			if(!result.length)
				return [ { it:this, parname:name } ];
			return result;
		}

		this.parOriginsHTML = function (name) {
			var used_html="";
			var olist = this.parOrigins(name);
			for(var i=0;i<olist.length;++i)
				if(olist[i].it != this)
					used_html = used_html + olist[i].it.Label() + '&nbsp;(as &nbsp;' + olist[i].parname + ')<br>'
			return used_html;
		}
		
		this.isParOrigin = function (name) {
			var orig = this.parOrigins( name );
			return orig.length == 1 && orig[0].it == this;
		}
		this.isWFParOrigin = this.isParOrigin;
		
		this.getPrevNeighbours = function(){ return []; }
		this.getPrevNeighboursNames = function() { return []; }

		this.propagateParDirection = function(par) {
			var used = this.usedBy();
			for(var i=0;i<used.length;++i){
				var cpar=used[i].parameters[par.Name];
				cpar.In = par.In;
				cpar.Out = par.Out;
				if(cpar.LinkedModule == 'self')
					used[i].parent.updateParDirection(cpar.LinkedParameter);
			}			
		}

		this.updateParDirection = function(name){
			var par=this.parameters[name];
			if(!par)
				return;
			var llist = this.linkedFrom(name,true);
			if (!llist.length)
				return;
			var indir=false,outdir=false;
			for (var i = 0; i < llist.length; ++i) {
				if (llist[i].it.parameters[llist[i].parname].In) 
					indir = true;
				if (llist[i].it.parameters[llist[i].parname].Out) 
					outdir = true;
			}
			if(par.In == indir && par.Out == outdir)
				return;
			par.In = indir;
			par.Out = outdir;
			this.propagateParDirection(par);
		}

	}
	// class Object ctor
	this.Obj = function (name,klass,descr) {
		this.Name = name;
		this.Type = klass.Type;
		this.DescrShort = descr?descr:klass.DescrShort;
		this.parent = null; // must be set later
		this.parameters = {};

		this.Label = function () { return this.Name; }
		this.getKlass = function () { return CEO.klass[this.Type]; }
		this.isTopLevel = function () { return this==CEO.topLevel; }
		this.isExe = function() { return CEO.klass[this.Type].Body!=undefined; }
		this.isKlass = false;

		this.isParOrigin = function( name ){ return false; }
		this.isWFParOrigin = function( name ){ return (this == CEO.topLevel) ? this.getKlass().isWFParOrigin(name):false;}
		this.removeParameter = function(name) { return false; } 
		
		this.update = function ( cdict ){
			if(cdict.Type || cdict.Parameters != undefined)
				return CEO.error("CEO: can't modify object type or parameters")
			if(cdict.Name != undefined){
				if(!cdict.Name)
					return CEO.warn("Name can't be void")
				for(var i=0;i<this.parent.obj.length;i++)
					if(this.parent.obj[i].Name == cdict.Name)
						return CEO.warn("'"+cdict.Name+"' already exist");
			}
			var oldname = this.Name;
			CEO.applyChanges(this,cdict);
			if(this.Name != oldname && this.parent){
				var plist = this.parList();
				for (var i = 0; i < plist.length; ++i) {
					var oldlink = plist[i].LinkedParameter;
					if (plist[i].LinkedModule == 'self' && oldlink == oldname + '_' + plist[i].Name){
						plist[i].LinkedParameter = this.Name + '_' + plist[i].Name;
						this.parNameChange([ { it: this.parent, oldname: oldlink, newname: plist[i].LinkedParameter } ]);
					}
				}
			}
			return true;
		}

		this.getPrevNeighbours = function() {
			if(this == CEO.topLevel)
				return [];
			var nlist = this.parent.obj;
			var n=0;
			for(;n<nlist.length;++n)
				if(nlist[n] == this)
					break;
			return nlist.slice(0,n);
		}
		
		this.getPrevNeighboursNames = function() {
			var nlist = this.getPrevNeighbours();
			var result =[];
			for(var i=0;i<nlist.length;++i)
				result.push(nlist[i].Name);
			return result;
		}
		
		this.getNextNeighbours = function() {
			if(this == CEO.topLevel)
				return [];
			var nlist = this.parent.obj;
			var n=0;
			for(;n<nlist.length;++n)
				if(nlist[n] == this)
					break;
			return nlist.slice(n+1);
		}

		this.getNeighboursLinks = function(name) {
			var result = [];
			var nlist = this.getNextNeighbours();
			for(var j=0;j<nlist.length;++j){
				for(var k in nlist[j].parameters){
					var p = nlist[j].parameters[k];
					if(typeof p != 'function' && p.LinkedModule == this.Name && (!name || p.LinkedParameter == name))
						result.push({it:nlist[j], parname:p.Name});
				}
			}
			return result;			
		}

		this.isLinkedToNeighbour = function(objname) {
			for (var i in this.parameters) {
				var p = this.parameters[i];
				if (typeof p != 'function' && p.LinkedModule == objname) 
					return true;
			}
			return false;
		}

		this.propagateRemoveParameter = function (name) {
			if(this.parameters[name] == undefined)
				return;
			var parent_link = null;
			if(this.parameters[name].LinkedModule == 'self')
				parent_link = this.parameters[name].LinkedParameter;
			delete this.parameters[name];
			if(parent_link)
				if(!this.parent.removeParameter(parent_link,true))
					this.parent.updateParDirection(parent_link);
		}
		
		this.parOrigins = function (name ) { return this.getKlass().parOrigins( name ); }
		
		this.parOriginsHTML = function (name) {
			var used_html=this.getKlass().parOriginsHTML(name);
			var links = this.getNeighboursLinks(name);
			for(var i=0;i<links.length;++i)
					used_html = used_html + links[i].it.Label() + '&nbsp;(as &nbsp;' + links[i].parname + ')<br>'	
			return used_html;
		}
		
		this.addPar = function ( par ) {
			if(this.parameters[par.Name])
				return;
			var mypar=new CEO.Par(par);
			this.parameters[par.Name] = mypar;
			if(!mypar.LinkedModule || !this.parent)
				return;
			if(par.LinkedParameter == par.Name)
				mypar.LinkedParameter = this.defParLinkName(this.LType(mypar),mypar.Name);
			if(this.LType(mypar) == 'Ne')
				return; 
			mypar.LinkedModule = 'self';
			if (this.parent.parameters[mypar.LinkedParameter] == undefined) {
				var ppar=mypar.clone();
				ppar.Name = mypar.LinkedParameter;
				this.parent.addPar(ppar, this.parent.nextLType(this.getKlass().LType(par)));
			} else
				this.parent.updateParDirection(mypar.LinkedParameter);
		}
		this.updatePar = function(par, pdict, ltype){
			var udict = CEO.getChanges(par,pdict,[ 'Name', 'parameters']);
			if(udict == undefined)
				return false;
			if(ltype && !pdict.LinkedParameter)
				return CEO.warn("Target parameter name can't be void")
			var oldltype=this.LType(par);
			var oldlmod = par.LinkedModule;
			var oldlpar = par.LinkedParameter;
			CEO.applyChanges(par,pdict);
			if(udict.LinkedModule == undefined && udict.LinkedParameter == undefined)
				return true; // note that changing link type can't be applyed in case link already exist
			if(oldltype && oldltype!='Ne') // forget old relations;
				if(!this.parent.removeParameter(oldlpar,true))
					this.parent.updateParDirection(oldlpar);
			if(ltype && ltype!='Ne'){
				if(!this.parent.parameters[par.LinkedParameter]){
					var ppar=par.clone();
					ppar.Name = par.LinkedParameter;
					this.parent.addPar(ppar,this.parent.nextLType(ltype));
				}
			}
			return true;
		}

	}

	// class Parameter ctor
	this.Par = function (pdict) {
		// Set value from dictionary (or another parameter). No check are performed.
		this.setValue = function(vdict) {
			var attrib = [ "LinkedModule", "LinkedParameter", "In", "Out", "Value","Description"];
			for(var i=0;i<attrib.length;i++)
				this[attrib[i]] =  (vdict[attrib[i]] == undefined)?'':vdict[attrib[i]];
			if (typeof this.In == 'string')
				this.In = (this.In == "True") ? true : false;
			if (typeof this.Out == 'string')
				this.Out = (this.Out == "True") ? true : false;
			if(this.LinkedParameter && !this.LinkedModule)
				this.LinkedModule = 'self';
		}
		
		// Just forget the link.
		this.clearLink = function() {
			this.LinkedModule = '';
			this.LinkedParameter = '';
		}

		if(pdict == undefined) // clone support
			return;

		var attrib = [ "Name", "Type", "Description"];
		for(var i=0;i<attrib.length;i++)
			this[attrib[i]] =  (pdict[attrib[i]] == undefined)?'':pdict[attrib[i]];
		this.setValue(pdict);
	}

	// public:

	// display alert and return false
	this.error = function (msg) {
		window.alert(msg);
		return false;
	}
	
	// display warning
	this.warn = this.error;
	
	// Reset complete CEO
	this.reset = function () {
		this.topLevel = null;
		this.klass = {};
	}
	
	// Add one class from attributes dictionary and optional parameters list
	this.addKlass = function ( kdict, plist ) {
		var k = new this.Klass(kdict);
		if(!k.Type)
			return this.error("You have to provide not empty type ");
		if(this.klass[k.Type])
			return this.error("Duplicated type '"+k.Type+"'");
		for(var i in plist)
			if(typeof plist[i] != 'function')
				if (!k.addPar(plist[i])) 
					return false;
		this.klass[k.Type] = k;
		return true;
	}

	// Instanciate topLevel from class
	this.setTopLevel = function (name,kname,descr) {
		if(this.topLevel)
			return this.error("CEO BUG: only one topLevel object is allowed");
		var klass = this.klass[kname];
		if(!klass)
			return this.error("Type '"+kname+"' is undefined");
		this.topLevel = new this.Obj(name,klass);
		var kplist=klass.parList();
		for(var i=0;i<kplist.length;++i){
			kplist[i].clearLink();
			this.topLevel.addPar(kplist[i]);
		}
		return true;
	}

	this.getFreeKlassType = function (prefix) {
		var i=1;
		while(this.klass[""+prefix+i])
			++i
		return ""+prefix+i;
	}

	this.remove = function (it) {
		if(it.isKlass){
			if(it.usedBy().length)
				return this.warn("'"+it.Type+"' is still in use");
			while(it.obj.length)
				this.remove(it.obj[0])
			delete this.klass[it.Type];
		} else {
			var dlinks = it.getNeighboursLinks();
			if(dlinks.length)
				return this.warn("'"+it.Name+"' is linked from '"+dlinks[0].it.Name+"'");
			var parent = it.parent;
			var n=0;
			for(;n<parent.obj.length;++n)
				if(parent.obj[n] == it)
					break;
			parent.obj.splice(n,1);
			var plist=it.parList();
			delete it;
			for(var i=0;i<plist.length;++i)
				if(plist[i].LinkedModule=='self')
					if(!parent.removeParameter(plist[i].LinkedParameter,true))
						parent.updateParDirection(plist[i].LinkedParameter);
		}
		return true;
	}

	// WF compatibility
	// fill from workflow
	this.fromWF = function (_wf) {
		this.reset();
		var kdict = { Type:"WorkFlow",DescrShort:_wf.DescrShort,Description:_wf.Description,
					  Origin:_wf.Origin, Version:_wf.Version };
		if(!this.addKlass(kdict,_wf.parameters) || !this.setTopLevel(_wf.Name,"WorkFlow"))
			return false;
		for(var i=0;i<_wf.module_definitions.length;++i)
			if(!this.addKlass(_wf.module_definitions[i],_wf.module_definitions[i].parameters))
				return false;
		for (var i = 0; i < _wf.step_definitions.length; ++i) {
			var step_def = _wf.step_definitions[i];
			if (!this.addKlass(step_def, step_def.parameters)) 
				return false;
			var klass = this.klass[step_def.Type];
			for(var j=0;j < step_def.module_instances.length; ++j) {
				var mod = step_def.module_instances[j];
				if(!klass.addObj(mod.Name,mod.Type,mod.ShortDescr,mod.parameters))
					return false;
			}
		}
		var klass = this.klass["WorkFlow"];
		for (var i = 0; i < _wf.step_instances.length; ++i) {
			var step = _wf.step_instances[i];
			if(!klass.addObj(step.Name,step.Type,step.ShortDescr,step.parameters))
				return false;
		}
		return true;
	}

	this.toWF = function () {
		swf = this.topLevel.toWF();
		swf.Type = "";
		var tk = this.klass["WorkFlow"];
		swf.parameters = tk.toWF().parameters; // since we edit them, not instance...
		swf.Description = tk.Description;
		swf.Origin = tk.Origin;
		swf.Version = tk.Version;
		var inst = [];
		for(var i=0;i<tk.obj.length;++i)
			inst.push(tk.obj[i].toWF());
		swf.step_instances = inst;
		var sdefs = [];
		var sdefl = this.getWFStepList();
		for(var i=0;i<sdefl.length;++i){
			var sdef = sdefl[i].toWF();
			var minst = [];
			for(var j=0;j<sdefl[i].obj.length;++j)
				minst.push(sdefl[i].obj[j].toWF());
			sdef.module_instances = minst;
			sdefs.push(sdef);
		}
		swf.step_definitions = sdefs;
		var mdefs = [];
		var mdefl = this.getWFModulesList();
		for(var i=0;i<mdefl.length;++i)
			mdefs.push(mdefl[i].toWF());
		swf.module_definitions = mdefs;
		return swf;
	}

	this.getWFModulesList = function () {
		var result = [];
		for(var i in this.klass)
			if(typeof this.klass[i] == 'object' && this.klass[i].isExe() )
				result.push(this.klass[i]);
		return result;
	}

	this.getWFStepList = function () {
		var result = [];
		for(var i in this.klass)
			if(typeof this.klass[i] == 'object' && !this.klass[i].isExe() && !this.klass[i].isTopLevel())
				result.push(this.klass[i]);
		return result;
	}

	// WFE helpers
	this.getWFTreeList = function ( tname , parent) {
		switch (tname) {
			case "WfTree":
				if(!this.topLevel)
					break;
				return (parent)?this.topLevel.getKlass().obj:[ this.topLevel ];
			case "StepsTree":
				if(parent)
					return parent.obj;
				return this.getWFStepList();
			case "ModulesTree":
				if(parent)
					break;
				return this.getWFModulesList();
		}
		return []
	}

	// CEO ctor	
	this.reset();
}

// AZ: Is there better way to do that ???
CEO.Klass.prototype = new CEO.ParList();
CEO.Obj.prototype = new CEO.ParList();
