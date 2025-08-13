import { useState } from 'react'

function App() {
const [count, setCount] = useState(0)

return (
<>

<div className="header"> <h1>The G List</h1> </div> <div className="card" style={{ padding: '1rem', margin: '1rem' }}> <button onClick={() => setCount((c) => c + 1)} className="btn"> count is {count} </button> <p>Edit <code>src/App.jsx</code> and save to test HMR</p> </div> <p className="read-the-docs" style={{ margin: '1rem' }}> This is a plain CSS setup. No Tailwind required. </p> </>
)
}

export default App