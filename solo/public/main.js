const form = document.querySelector('.url-form');


form.addEventListener('submit', (e)=>{
    e.preventDefault();
    //URL captured in userInput.value
    const userInput = document.querySelector('.url-input');
    console.log(userInput.value);

    fetch('/short', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            url: userInput.value,
        })
    })
    .then(response => {
        if(!response.ok){
            console.log(response);
            throw Error;
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
    })
});