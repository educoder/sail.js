
var Sail = window.Sail || {}

Sail.Strophe = {
    bosh_url: null,
    jid: null,
    password: null,
    
    connect: function() {
        if (!this.bosh_url) throw "No bosh_url set!"
        if (!this.jid) throw "No jid set!"
        if (!this.password) throw "No password set!"
        
        this.conn = new Strophe.Connection(this.bosh_url)
        
        this.conn.xmlInput = function(data) {
            console.log("IN:", $(data).children()[0])
        }
        this.conn.xmlOutput = function(data) {
            console.log("OUT:", $(data).children()[0])
        }
        
        console.log('CONNECTING TO '+this.bosh_url+'WITH: '+this.jid+'/'+this.password)
        this.conn.connect(this.jid, this.password, this.onConnect)
    },
    
    joinGroupchat: function(room, success, failure) {
        if (!success) success = this.onSuccess
        if (!failure) failure = this.onFailure
        
        pres = $pres({to: room+"/"+this.jid}).c('x', {xmlns: 'http://jabber.org/protocol/muc'})
        this.conn.send(pres.tree(), success, failure)
        
        this.conn.addHandler(function(){
            console.log("REJOINING "+room)
            Sail.Strophe.joinGroupchat(room)
          }, null, "presence", "unavailable")
        
        return new Sail.Strophe.Groupchat(this.conn, room)
    },
    
    addHandler: function(handler, ns, name, type, id, from) {
        if (!Sail.Strophe.conn) throw "Must connect before you can add handlers"
        Sail.Strophe.conn.addHandler(function(stanza){handler(stanza);return true}, ns, name, type, id, from)
    },
    
    /** Event Handlers -- override these as required **/
    
    onConnect: function (status) {
        if (status === Strophe.Status.CONNECTED) {
            console.log('CONNECTED to '+Sail.Strophe.bosh_url)
            Sail.Strophe.onConnectSuccess()
        } else if (status === Strophe.Status.DISCONNECTED) {
            console.log('DISCONNECTED from '+Sail.Strophe.bosh_url)
        } else if (status === Strophe.Status.CONNECTING) {
            console.log('CONNECTING to '+Sail.Strophe.bosh_url)
        } else if (status === Strophe.Status.AUTHENTICATING) {
            console.log('AUTHENTICATING')
        } else {
            console.log('UNKNOWN CONNECTION STATUS: '+status)
        }
    },
    
    onConnectSuccess: function() {
        console.log("CONECTED SUCCESSFULLY")
        return true  
    },
    
    onGroupchatMessage: function(msg) {
        console.log($(msg).find('body').text())
        return true
    },
    
    onSuccess: function(msg) {
        console.log("SUCCESS: "+msg)
        return true
    },
    
    onFailure: function(msg) {
        console.log("FAILURE: "+msg)
        return true
    }
}

Sail.Strophe.Groupchat = function(conn, room) {
    this.conn = conn
    this.room = room
}

Sail.Strophe.Groupchat.prototype = {
    sendXML: function(xml, success, failure) {
        if (!success) success = this.onSuccess
        if (!failure) failure = this.onFailure

        msg = $msg({to: this.room, type: 'groupchat'}).c('body').c(xml)
        this.conn.send(msg.tree(), success, failure)
    },
    
    sendText: function(text, success, failure) {
        if (!success) success = this.onSuccess
        if (!failure) failure = this.onFailure

        msg = $msg({to: this.room, type: 'groupchat'}).c('body').t(text)
        this.conn.send(msg.tree(), success, failure)
    },
    
    sendJSON: function(data, success, failure) {
        if (!success) success = this.onSuccess
        if (!failure) failure = this.onFailure

        msg = $msg({to: this.room, type: 'groupchat'}).c('body').t(JSON.stringify(data))
        this.conn.send(msg.tree(), success, failure)
    },
    
    addHandler: function(handler, ns, name, id, from) {
        if (!Sail.Strophe.conn) throw "Must connect before you can add handlers"
        Sail.Strophe.conn.addHandler(function(stanza){handler(stanza);return true}, ns, name, "groupchat", id, from)
    },
    
    onMessage: function(msg) {
      console.log("GROUPCHAT: ", msg)
      return true
    },
    
    onSuccess: function(msg) {
        console.log("SUCCESS: ", msg)
        return true
    },
    
    onFailure: function(msg) {
        console.log("FAILURE: ", msg)
        return true
    }
}