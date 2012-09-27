// Collections
Names = new Meteor.Collection("names");
Msgs = new Meteor.Collection("msgs");
Rooms = new Meteor.Collection("rooms");

get_parent_param = function(){
    // This is used when inside an iframe
    var parent;
    try{
        parent = get_params()['parent'];
    } catch(err) {
    }
    return parent ? parent : window.location.hostname;
}

get_params = function(){
    var params = window.location.href.split('?'),
        params_dict = Object(),
        p_split;
    if (params.length == 2){
        params = params[1].split('&');
        for(var i in params){
            if (params.hasOwnProperty(i)){
                p_split = params[i].split('=');
                params_dict[p_split[0]] = p_split[1];
            }
        }
    }
    return params_dict;
}

Msg = {
    says : function(name, action, msg) {
        return Msgs.insert({
            user : name,
            action : action,
            msg : msg,
            room : Session.get('room'),
            host: PARENT
        });
    },
};

Name = {
    remove : function(name, room) {
        return Names.remove({
            name : name,
            room : room,
            host : PARENT
        });
    },
    get : function(name, room) {
        return Names.findOne({
            name : name,
            room : room,
            host : PARENT
        });
    },
    set : function(name, room) {
        return Names.insert({
            name : name,
            room : room,
            host : PARENT
        });
    }
};

Room = {
    set : function(name) {
        return Rooms.insert({
            name : name,
            host : PARENT
        });
    },
    get : function(name) {
        return Rooms.findOne({
            name : name,
            host : PARENT
        });
    }
}

Validation = {
    get_error : function(msg) {
        return Session.get('error');
    },
    set_error : function(msg) {
        return Session.set('error', msg);
    },
    clear_error : function() {
        return Session.set('error', undefined);
    },
    name_valid : function(name, room) {
        this.clear_error();
        if (name.length == 0) {
            this.set_error('Name cannot be blank.');
            return false;
        }
        if (Name.get(name, room)) {
            this.set_error('Name already being used.');
            return false;
        }
        if (name.length > 20){
            this.set_error('Name must contain 20 chars max.');
            return false;
        }
        return true;
    },
    room_valid : function(name) {
        this.clear_error();
        if (name.length == 0) {
            this.set_error('Room name cannot be blank.');
            return false;
        }
        if (Room.get(name)) {
            this.set_error('Room name already being used.');
            return false;
        }
        if (name.length > 20){
            this.set_error('Room name must contain 20 chars max.');
            return false;
        }
        return true;
    }
};

function freezeScreen(ms){

    var s=(new Date).getTime();

    while(((new Date).getTime())-s<ms){}

    return 'Bla';
};

if (Meteor.is_client) {
    var PARENT = get_parent_param();
    // jQuery(window).unload(function() {
    window.onbeforeunload = function(){
        // This does not work :(
        Meteor.call('exit', Session.get('name'), Session.get('room'));
        // var test0 = Name.remove(Session.get('name'), Session.get('room'));
        var test = Name.get(Session.get('name'), Session.get('room'));
        // var teste = 'teste';
        console.log(test);
        // return test.toString();
    };
    

    Template.entrance.rooms = function() {
        return Rooms.find({
            host : PARENT
        });
    };

    Template.entrance.users = function() {
        return Names.find({
            host : PARENT
        });
    };

    Template.entrance.joined = function() {
        if (Session.get('joined')) {
            return true;
        }
        return false;
    };
    
    Template.chatroom.msgs = function() {
        return Msgs.find({
            room : Session.get('room'),
            host : PARENT
        });
    };
    
    Template.chatroom.room_actual = function() {
        return Session.get('room');
    };

    Template.chatroom.scroll_to_bottom = function() {
        Meteor.defer(function() {
            try {
                var chat = document.getElementById('chat');
                chat.scrollTop = chat.scrollHeight;
            } catch(err) {
                console.log(err);
            }
        });
    };

    send_msg = function(e) {
        e = e || event;
        if ((e.keyCode || event.which || event.charCode || 0) == 13 ||
            e.type == 'click') {
            var $msg_box = document.getElementById('msg');
            var msg = $msg_box.value.trim();
            Msg.says(Session.get('name'), ' says: ', msg);
            $msg_box.value = ''; 
        }
    };

    Template.entrance.events = {
        'click button.room-create' : function(e) {
            var $room_name_input = document.getElementById('room-name'),
                name = $room_name_input.value.trim();
            if (Validation.room_valid(name))
                Room.set(name);
            else
                alert(Validation.get_error());
            $room_name_input.value = '';
        },
        'click button.room-enter' : function() {
            var room = this.name;
            var name = document.getElementById('user-name').value.trim();
            if (Validation.name_valid(name, room)) {
                Name.set(name, room);
                Session.set('joined', true);
                Session.set('name', name);
                Session.set('room', room);
                Msg.says(name, ' ', 'joined room...', room);
            } else {
                alert(Validation.get_error());
            }
        },
        'click button.msg-send' : send_msg,
        'keydown #msg': send_msg,
        'click button.room-exit' : function() {
            var name = Session.get('name'),
                room = Session.get('room');
            Msg.says(name, ' ', 'left room...', room);
            Name.remove(name, room);
            Session.set('joined', false);
            Session.set('room', '');
        }
    };
}

if (Meteor.is_server) {
    Meteor.startup(function() {
        // Names.remove({}); // Workaround to remove names from list
    });
    Meteor.methods({
        exit : function(name, room) {
            // This does not work :(
            this.unblock();
            return Name.remove(name, room);
            
        }
    });
}
