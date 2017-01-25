function startApp() {
    // sessionStorage.clear();
    //App
    showMenuHideLinks();
    showView('viewAppHome');
    if (sessionStorage.getItem('username')) {
        showUserHomeView();
    }

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: () => {$('#loadingBox').show()},
        ajaxStop: () => {$('#loadingBox').hide()}
    });

    // Bind the navigation menu links
    $('#linkMenuAppHome').click(showHomeView);
    $('#linkMenuLogin').click(showLoginView);
    $('#linkMenuRegister').click(showRegisterView);
    $('#linkMenuLogout').click(logoutUser);
    $('#linkMenuUserHome').click(showUserHomeView);

    $('#linkMenuMyMessages').click(showMyMessages);
    $('#linkUserHomeMyMessages').click(showMyMessages);

    $('#linkMenuArchiveSent').click(showArchiveMessage);
    $('#linkUserHomeArchiveSent').click(showArchiveMessage);

    $('#linkMenuSendMessage').click(showSentMessageScreen);
    $('#linkUserHomeSendMessage').click(showSentMessageScreen);



    // Bind the form submit buttons
    $('#formLogin').submit(loginUser);
    $('#formRegister').submit(registerUser);
    $('#formSendMessage').submit(sentMessage);


    // Views
    function showView(viewName) {
        $('main > section').hide();
        $('main > div').hide();
        $('#' + viewName).show();
    }

    function showMenuHideLinks() {
        $('#menu a').hide();
        $('#spanMenuLoggedInUser').hide();
        if (sessionStorage.getItem("authToken")) {
            //Logged in user
            // $('#linkMenuAppHome').show();
            $('#linkMenuUserHome').show();
            $('#linkMenuMyMessages').show();
            $('#linkMenuArchiveSent').show();
            $('#linkMenuSendMessage').show();
            $('#linkMenuLogout').show();
        } else {
            //No user logged in
            $('#linkMenuAppHome').show();
            $('#linkMenuLogin').show();
            $('#linkMenuRegister').show();
        }
    }

    function showHomeView() {
        showView('viewAppHome');
    }

    function showUserHomeView() {
        $('#viewUserHomeHeading').text('Welcome, ' + sessionStorage.getItem('username') + '!');
        $('#spanMenuLoggedInUser').text('Welcome, ' + sessionStorage.getItem('username') + '!');
        $('#spanMenuLoggedInUser').show();
        showView('viewUserHome');
    }

    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset')
    }

    function showRegisterView() {
        showView('viewRegister');
        $('#formRegister').trigger('reset')
    }

    // AJAX request
    //AJAX const
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppId = 'kid_B1-VbIYme';
    const kinveyAppSecret = '9e7a026989494df8be63b7ac7c8c02d3';
    const kinveyAppAuthHeaders = {
        Authorization: 'Basic ' + btoa(kinveyAppId + ':' + kinveyAppSecret),
        contentType: 'application/json'
    };

    // Auth
    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        let name = userInfo.name;
        sessionStorage.setItem('name', name);

        $('#spanMenuLoggedInUser').text('Hello, ' + username + '!');
        $('#spanMenuLoggedInUser').show();
    }

    function getKinveyUserAuthHeaders() {
        return {
            Authorization: 'Kinvey ' + sessionStorage.getItem('authToken')
        };
    }

    function registerUser(e) {
        e.preventDefault();
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val()
        };
        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppId + '/',
            headers: kinveyAppAuthHeaders,
            data: userData
        }).then(registerSuccess)
            .catch(handleAjaxError);

        $('#formRegister input[name=username]').val('');
        $('#formRegister input[name=password]').val('');
        $('#formRegister input[name=name]').val('');

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showMenuHideLinks();
            showInfo('User registration successful.');
            $('#viewUserHomeHeading').text('Welcome, ' + sessionStorage.getItem('username') + '!');
            $('#spanMenuLoggedInUser').text('Welcome, ' + sessionStorage.getItem('username') + '!');
            $('#spanMenuLoggedInUser').show();
            showView('viewUserHome');
        }
    }

    function loginUser(e) {
        e.preventDefault();
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
        };

        $.ajax({
            url: kinveyBaseUrl + 'user/' + kinveyAppId + '/login',
            method: 'POST',
            headers: kinveyAppAuthHeaders,
            data: userData
        }).then(loginSuccess)
            .catch(handleAjaxError);

        $('#formLogin input[name=username]').val('');
        $('#formLogin input[name=password]').val('');

        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showMenuHideLinks();
            showInfo('Login successful.');
            $('#viewUserHomeHeading').text('Welcome, ' + sessionStorage.getItem('username') + '!');
            $('#spanMenuLoggedInUser').text('Welcome, ' + sessionStorage.getItem('username') + '!');
            $('#spanMenuLoggedInUser').show();
            showView('viewUserHome');
        }
    }

    function logoutUser() {
        $.ajax({
            url: kinveyBaseUrl + 'user/' + kinveyAppId + '/_logout',
            method: 'POST',
            headers: getKinveyUserAuthHeaders(),
        }).then(successLogout)
            .catch(handleAjaxError);

        function successLogout() {
            sessionStorage.clear();
            $('#loggedInUser').text('');
            showMenuHideLinks();
            showView('viewAppHome');
            showInfo('Logout successful.');
        }
    }
    //End here

    // AJAX request for  messages
    // Received messages

    function showMyMessages() {
        $('#myMessages').empty();
        showView('viewMyMessages');
        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppId + `/messages?query={"recipient_username":"${sessionStorage.getItem('username')}"}`,
            headers: getKinveyUserAuthHeaders()
        }).then(loadReceiveMessagesSuccess)
            .catch(handleAjaxError);

        function loadReceiveMessagesSuccess(messages) {
            showInfo('Received messages loaded.');
            let table = $('<table>');
            table.append(
                $('<tr>').append(
                    $('<th>').text('From'),
                    $('<th>').text('Message'),
                    $('<th>').text('Date Received')
                )
            );
            if (messages.length == 0) {
                $('#myMessages').append(table);
            } else {
                for (let message of messages) {
                    appendMsgRow(message, table);
                }
                $('#myMessages').append(table);
            }
            function appendMsgRow(message, table) {
                let fromTdData = message.sender_username;
                if (message.sender_name) {
                    fromTdData += ` (${message.sender_name})`;
                }
                let tr = $('<tr>').append(
                    $('<td>').text(fromTdData),
                    $('<td>').text(message.text),
                    $('<td>').text(formatDate(message._kmd.lmt))
                );
                table.append(tr);
            }
        }
    }

    function showArchiveMessage() {
        $('#sentMessages').empty();
        showView('viewArchiveSent');
        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppId + `/messages?query={"sender_username":"${sessionStorage.getItem('username')}"}`,
            headers: getKinveyUserAuthHeaders()
        }).then(loadArchiveMessagesSuccess)
            .catch(handleAjaxError);

        function loadArchiveMessagesSuccess(messages) {
            showInfo('Archive messages loaded.');
            let table = $('<table>');
            table.append(
                $('<tr>').append(
                    $('<th>').text('To'),
                    $('<th>').text('Message'),
                    $('<th>').text('Date Sent'),
                    $('<th>').text('Actions')
                )
            );
            if (messages.length == 0) {
                $('#sentMessages').append(table);
            } else {
                for (let message of messages) {
                    appendMsgRow(message, table);
                }
                $('#sentMessages').append(table);
            }
            function appendMsgRow(message, table) {
                let deleteLink = $('<button href="#">Delete</button>')
                    .click(deleteMessage.bind(this, message));
                let tr = $('<tr>').append(
                    $('<td>').text(message.recipient_username),
                    $('<td>').text(message.text),
                    $('<td>').text(formatDate(message._kmd.lmt)),
                    $('<td>').append(deleteLink)
                );

                table.append(tr);
            }
        }
        function deleteMessage(message) {
            $('#sentMessages').empty();
            $.ajax({
                method: 'DELETE',
                url: kinveyBaseUrl + 'appdata/' + kinveyAppId + '/messages/' + message._id,
                headers: getKinveyUserAuthHeaders()
            }).then(deleteMessageSuccess)
                .catch(handleAjaxError);

            function deleteMessageSuccess() {
                listMessageAfterDelete();
                showInfo('Message deleted.')
            }
            function listMessageAfterDelete() {
                $.ajax({
                    method: 'GET',
                    url: kinveyBaseUrl + 'appdata/' + kinveyAppId + `/messages?query={"sender_username":"${sessionStorage.getItem('username')}"}`,
                    headers: getKinveyUserAuthHeaders()
                }).then(loadArchiveMessagesSuccess)
                    .catch(handleAjaxError);
            }
        }
    }


    function showSentMessageScreen() {
        $('#formSendMessage #msgRecipientUsername').empty();
        showView('viewSendMessage');
        $.ajax({
            url: kinveyBaseUrl + 'user/' + kinveyAppId,
            headers: getKinveyUserAuthHeaders()
        }).then(loadSuccessAllUsers)
            .catch(handleAjaxError);
        
        function loadSuccessAllUsers(users) {
            let select = $('#formSendMessage #msgRecipientUsername');
            select.append($('<option>'));
            for (let user of users) {
                let option = $('<option>').text(formatSender(user.name, user.username)).val(user.username);
                select.append(option);
            }
        }
    }

    function sentMessage(e) {
        e.preventDefault();
        let recipient = $('#msgRecipientUsername').find(":selected").val();
        let message = $('#msgText').val();
        let sender = null;
        if (sessionStorage.getItem('name')) {
            sender = sessionStorage.getItem('name');
        }
        let msgData = {
            sender_username: sessionStorage.getItem('username'),
            sender_name: sender,
            recipient_username: recipient,
            text: message
        };
        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'appdata/' + kinveyAppId + '/messages',
            headers: getKinveyUserAuthHeaders(),
            contentType: 'application/json',
            data: JSON.stringify(msgData)
        }).then(messageSuccessSent)
            .catch(handleAjaxError);

        $('#msgText').val('');
        function messageSuccessSent() {
            showArchiveMessage();
            showInfo('Sent message success.');
            // showInfo('Archive messages loaded.');
        }
    }

    // Utility
    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }
    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0) {
            errorMsg = "Cannot connect due to network error.";
        } else if (response.responseJSON &&
            response.responseJSON.description) {
            errorMsg = response.responseJSON.description;
        } else {
            errorMsg = response.status + ' (' + response.statusText + ')';
        }
        showError(errorMsg);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut()
        }, 3000)
    }
    // End here
}