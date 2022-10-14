const engineMainUrl = "https://aressoftwareltd.neula.cloud/#/screen-portlet/";
const functionsUrl = "https://aressoftwareltd.neula.cloud/api/functions/portal_poc/"
const notSecretToken = "d4bfeceab452be3ae140c48654a028c9379bcfa074f223b76c0eaf9649e2e1b4c1e5";
// function initSessionId() {
//     let sessionId = sessionStorage.getItem("sessionId");
//     if(sessionId === null) {
//        // based on https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-253.php
//       sessionId = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
//            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
//        );
//       sessionStorage.setItem("sessionId", sessionId);
//     }
// }


document.addEventListener("DOMContentLoaded", function(){
    updateButtonsVisibility();
    openMainPage();
    checkSession();
});


function clearSessionId() {
    sessionStorage.removeItem("sessionId");
    openMainPage();
    checkSession();
}
function storeSessionId(sessionId) {
    sessionStorage.setItem("sessionId", sessionId);
    openMainPage();
    checkSession();
}
function getSessionId() {
    return sessionStorage.getItem("sessionId");
}


function callPortalFunction(name, paramsBody, onSuccess) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', functionsUrl+name);
    xhttp.setRequestHeader ("Authorization", "Bearer " + notSecretToken);
    xhttp.onload = function() {
        onSuccess(JSON.parse(xhttp.responseText));

    }
    xhttp.send(JSON.stringify(paramsBody));
}

function checkSession() {
    const sessionId = getSessionId();
    if(sessionId != null) {
        callPortalFunction("checkSession", {session_id: sessionId}, function(userInfo) {
            if(userInfo.first_name !== undefined) {
                document.getElementById("welcome").innerText = "Hello " + userInfo.first_name;
            } else {
                document.getElementById("welcome").innerText = "";
                clearSessionId();
                updateButtonsVisibility();
            }
        });
    } else {
        document.getElementById("welcome").innerText = "";
        updateButtonsVisibility();
    }
}
// initSessionId();

function openLogin() {
    const element = document.getElementById("enginePage");
    element.setAttribute("src", engineMainUrl + "1c9luig3u6x3g/ca05q48d9f8x")
    element.classList.remove("hidden");
}

function logout() {
    const sessionId = getSessionId();

    callPortalFunction("logout", {session_id: sessionId}, () => {
        const element = document.getElementById("enginePage");
        element.setAttribute("src", engineMainUrl + "a/b"); // hack to ensure current screen reload
        clearSessionId();
        updateButtonsVisibility();
    });

}

function openRegister() {
    const element = document.getElementById("enginePage");
    element.setAttribute("src", engineMainUrl + "1c9luig3u6x3g/187nr0xaplmv4");
    element.classList.remove("hidden");
}

function openMainPage() {
    const element = document.getElementById("enginePage");
    const sessionId = getSessionId();
    if(sessionId === null) {
        element.setAttribute("src", engineMainUrl + "1c9luig3u6x3g/z80s3y992a57?session_id=")
    } else {
        element.setAttribute("src", engineMainUrl + "1c9luig3u6x3g/z80s3y992a57?session_id="+sessionId);
    }
}

function updateButtonsVisibility() {
    const sessionId = getSessionId();
    const loggedIn = sessionId !== null;
    showButton("Login", !loggedIn);
    showButton("Logout", loggedIn);
    showButton("Register", !loggedIn);
}

function showButton(id, visible) {
    document.getElementById(id).classList.toggle("hidden", !visible);
}


function onScreenPortletAttributeChanged(param) {
    if(param[0] === "session_id") {
        storeSessionId(param[1]);
        console.log("Session: '" + param[1]+"'");
    }
    updateButtonsVisibility();
}