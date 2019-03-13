const form = document.querySelector('.url-form');
const linkHolder = document.querySelector('.result');
const link = document.querySelector('#shortLink')


form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const userInput = document.querySelector('.url-input');

    fetch('/short', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            url: userInput.value,
        }),
    })
    .then(response => {
        if(!response.ok){
            throw Error;
        }
        return response.json();
    })
    .then(data => {
        let urlstring = location.origin + '/' + data.shortID;

        linkHolder.style.display = 'flex';
        link.href = urlstring;
        link.innerHTML = urlstring;
    })
});

// 