import './App.css';

const { REACT_APP_DOMAIN_NAME } = process.env;

const domainName = REACT_APP_DOMAIN_NAME || globalThis.location.hostname.split('.').slice(1).join('.')

const assetUrl = `https://asset.${domainName}/my-dog.jpg`;
const apiUrl = `https://api.${domainName}`

function App() {

  const reload = () => {
    globalThis.location.reload();
  }

  const getCookie = () => {
    fetch(apiUrl, {
      credentials: "include",
      mode: 'cors'
    }).then((res) => {
      if (res.ok) {
        reload()
      } else {
        console.error(res.statusText)
        throw new Error('Status is not OK')
      }
    }).catch(() => {
      alert('Failed to fetch')
    })
  }

  return (
    <main className='app'>
      <div className='app-button__container'>
        <button type='button' onClick={getCookie}>Get Signed Cookie</button>
      </div>
      <div className='app-image__container'>
        <img width={300} src={assetUrl} alt="This is a private asset" />
      </div>
    </main>
  );
}

export default App;
