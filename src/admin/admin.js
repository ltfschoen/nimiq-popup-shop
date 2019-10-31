const { privateKey, publicKey } = localStorage.crypto
const shop = new Shop(configuration)
const $ = document.getElementById.bind(document)

function initialize() {
    console.log(privateKey)
    if (!privateKey) {
        console.log('Setup required.')
        return (location.href = 'setup.html')
    }

    loadOpenOrders()
}

async function loadOpenOrders() {
    const orders = await shop.list(privateKey)
    const list = $('open_orders')
    list.innerHTML = ''
    if (list.length > 0) {
        orders.forEach(order => {
            const li = document.createElement('li')
            li.textContent = order
            list.appendChild(li)
        })
    } else {
        list.textContent = 'none'
    }
}

window.addEventListener('load', initialize)
