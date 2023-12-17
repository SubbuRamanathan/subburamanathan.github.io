const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const getStartedBtn = document.querySelector("#getStarted");
const suggestions = document.querySelectorAll(".suggestion .chat.outgoing");
let threadid = '';
let runid = '';

let userMessage = null; // Variable to store user's message
const API_KEY = getCookie("API_KEY");
const inputInitHeight = chatInput.scrollHeight;
const headersObject = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v1"
};

const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<img src=".\\altudo_logo.png" /><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").innerHTML = message;
    return chatLi; // return chat <li> element
}

const createThread = () => {
    const API_URL = "https://api.openai.com/v1/threads";

    const requestOptions = {
        method: "POST",
        headers: headersObject
    }

    // Send POST request to API, get response and set the reponse as paragraph text
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        threadid = data.id;
    }).catch(() => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    });
}

const createAndRetrieveMessage = (userMessage, chatElement) => {
    const API_URL = `https://api.openai.com/v1/threads/${threadid}/messages`;

    const requestOptions = {
        method: "POST",
        headers: headersObject,
        body: JSON.stringify({
            "role": "user",
            "content": userMessage
        })
    }

    // Send POST request to API, get response and set the reponse as paragraph text
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        runThread(chatElement);
    }).catch(() => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    });
}

const runThread = (chatElement) => {
    const API_URL = `https://api.openai.com/v1/threads/${threadid}/runs`;
    const requestOptions = {
        method: "POST",
        headers: headersObject,
        body: JSON.stringify({
            "assistant_id": "asst_fKdOHS2IGb8MyNaesOThaBqU"
        })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        runid = data.id;
        pollAndGetResponse(chatElement);
    }).catch(() => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    });
}

async function pollAndGetResponse(chatElement){
    const interval = setInterval(async function () {
        const API_URL = `https://api.openai.com/v1/threads/${threadid}/runs/${runid}`;
        const requestOptions = {
            method: "GET",
            headers: headersObject
        }
        await fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
            if (data.status == 'completed') {
                getResponse(chatElement);
                clearInterval(interval);
            }
        })
    }, 2000);
}

const getResponse = (chatElement) => {
    const API_URL = `https://api.openai.com/v1/threads/${threadid}/messages`;
    const messageElement = chatElement?.querySelector("p");

    const requestOptions = {
        method: "GET",
        headers: headersObject
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(result => {
        const content = result.data[0].content[0].text.value;
        const generatingHTMLText = `Awesome! I'm crafting a personalized webpage tailored just for you. I will take you there momentarily..`;
        if (messageElement.textContent != generatingHTMLText) {
            if (content.length < 700) {
                messageElement.textContent = result.data[0].content[0].text.value;
            }
            else {
                messageElement.textContent = generatingHTMLText;
                createAndRetrieveMessage(`Generate an HTML code for a webpage using white, black and #FFC906 colors by including components like hero banner, listing components, etc. with this content and share the generated code here embedded within the message. Auto generate a title for this content, which should be 50 characters or less. Ensure that the Hero banner includes one of these images(randomly changing for every request) 'https://www.altudo.co/-/media/project/altudo/altudo/image-collection/technology-pages/sitecore/hero-banner/web-1920--40.png?h=1080&iar=0&w=1920&hash=C32A7F40A0FA25E9BDACC66DDBEEA78B' or 'https://www.altudo.co/-/media/project/altudo/altudo/image-collection/services-pages/enterprise-website/hero-banner/web-1920--42.png?h=1080&iar=0&w=1920&sc_lang=en&hash=7D2A2944A78C479FCFA14CC34F232D47' or 'https://www.altudo.co/-/media/project/altudo/altudo/image-collection/services-pages/digital-experience-platforms/hero-banner/web-1920--72.png?h=1080&iar=0&w=1920&sc_lang=en&hash=9A9A8096B18FDA0798447D7156B44937' as background with title left-aligned covering only left 50% width of the page and black in color:` + content, chatElement);
            }
        }
        else {
            const html = result.data[0].content[0].text.value;
            paintPage(html);
        }
    }).catch((error, messageElement) => {
        console.log(error);
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

const paintPage = (html) => {
    var parser = new DOMParser();
    const personalizedHTMLDocument = parser.parseFromString(html, 'text/html');
    document.getElementsByTagName('title')[0].innerHTML = personalizedHTMLDocument.getElementsByTagName('title')[0].innerHTML;
    var iframeHTML = personalizedHTMLDocument.documentElement.innerHTML.replace(/<body>(.[^<]*)</g, '<body><');

    var iframe = document.getElementsByTagName('iframe')[0];
    var iframeWindow = iframe.contentWindow || (iframe.contentDocument.document || iframe.contentDocument);
    iframeWindow.document.open();
    iframeWindow.document.write(iframeHTML);
    iframeWindow.document.close();
    iframe.style.display = 'block';

    document.getElementById('chatbot-container').classList.add('overlay');
    chatbotToggler.style.display = 'flex';
}

const handleChat = () => {
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if(!userMessage) return;

    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    
    setTimeout(() => {
        // Display "Thinking..." message while waiting for the response
        const incomingChatLi = createChatLi("<img class='loading' src='.\\loading.gif' />", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        createAndRetrieveMessage(userMessage, incomingChatLi);
    }, 600);
}

chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window 
    // width is greater than 800px, handle the chat
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
//closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
suggestions.forEach(function (element) {
    element.addEventListener("click", (event) => {
        chatInput.value = event.target.innerHTML;
        document.getElementsByClassName("suggestion")[0].remove();
        handleChat();
    })
});
getStartedBtn.addEventListener("click", () => {
    document.getElementById("welcome-container").remove();
    document.getElementById("chatbot-container").style.display = 'block';
});

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

if (threadid == '') {
    createThread();
}