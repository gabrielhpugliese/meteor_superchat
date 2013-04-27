
Template.chatroom.rendered = function () {
    // TODO: Ask meteor-talk about this unbind strange behaviour
    $('#msg').unbind('keydown');
    $('#msg').keydown(function (event) {
        if ((event.keyCode || event.which || event.charCode || 0) != 13)
            return;
            
        sendMsg();
    });
}

Template.chatroom.msgs = function() {
    if (!Meteor.router)
        return;
    
    return Msgs.find({host : Meteor.router.invocation().host});
};

Template.chatroom.scrollToBottom = function() {
    // TODO: Figure how to do it properly
    Meteor.defer(function() {
        try {
            var chat = document.getElementById('chat');
            chat.scrollTop = chat.scrollHeight;
        } catch(err) {}
    });
};

Template.chatroom.events({
    'click .msg-send' : function () {
        sendMsg();
    },
    'click .set-name' : function () {
        var newName = $('input[name=user-name]').val();
        if (Session.get('name') && Session.get('name') != newName) {
            Msgs.insert({
                action: 'changed name to',
                msg: newName,
                owner: Session.get('name'),
                host: Meteor.router.invocation().host,
                color: $('input.color').val()
            });
        }
        Session.set('name', newName);
    }
});

sendMsg = function () {
    var $msg = $('#msg');
    
    Msgs.insert({
        action: 'says',
        msg: $msg.val(),
        owner: Session.get('name'),
        host: Meteor.router.invocation().host,
        color: $('input.color').val()
    });
    $msg.val('');
}

