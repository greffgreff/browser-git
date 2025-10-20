import { useState } from 'react'
import git from 'https://esm.sh/isomorphic-git@1.27.1'
// import git from 'isomorphic-git'
import http from 'https://esm.sh/isomorphic-git@1.27.1/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'

async function clearRepos() {
	try {
		await new Promise((resolve, reject) => {
			const req = indexedDB.deleteDatabase('fs') // 'fs' is your LightningFS namespace
			req.onsuccess = () => resolve(true)
			req.onerror = () => reject(req.error)
			req.onblocked = () => console.warn('Database deletion blocked')
		})
		console.log('✅ All repos cleared from IndexedDB')
	} catch (err) {
		console.error('Failed to clear repos:', err)
	}
}

export default function GitInit() {
	const [repoName, setRepoName] = useState('my-repo')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [token, setToken] = useState('')
	const [status, setStatus] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleInit() {
		if (!repoName || !username || !email || !token) {
			setStatus('Please fill in all fields.')
			return
		}

		setLoading(true)
		setStatus('Initializing repo...')

		try {
			const fs = new LightningFS('fs')
			const pfs = fs.promises

			const dir = `/repo-${repoName}`

			// Create folder structure
			try {
				await clearRepos()
			} catch {}
			try {
				await pfs.mkdir(dir)
			} catch {}

			// Create a README
			await pfs.writeFile(`${dir}/README.md`, `# ${repoName}\n\nInitialized from browser.`)

			// Initialize repository
			await git.init({ fs, dir })
			setStatus('Repository initialized.')

			// Set user config
			await git.setConfig({ fs, dir, path: 'user.name', value: username })
			await git.setConfig({ fs, dir, path: 'user.email', value: email })

			// Stage and commit
			await git.add({ fs, dir, filepath: 'README.md' })
			await git.commit({
				fs,
				dir,
				message: 'Initial commit',
				author: { name: username, email }
			})

			// Rename to main (GitHub default)
			await git.branch({ fs, dir, ref: 'main', checkout: true })

			setStatus('Committed initial files.')

			// Add remote
			// const remoteUrl = `https://${username}:${token}@github.com/${username}/${repoName}.git`
			const remoteUrl = `https://github.com/${username}/${repoName}.git`
			await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl })

			setStatus('Pushing to GitHub...')

			// Push to GitHub (requires personal access token)
			await git.push({
				fs,
				http,
				dir,
				remote: 'origin',
				ref: 'main',
				corsProxy: 'https://cors.isomorphic-git.org',
				headers: {
					Authorization: `Bearer ${token}`
				}
				// onAuth: () => ({ username: token, password: 'x-oauth-basic' })
			})

			setStatus('✅ Successfully pushed to GitHub!')
		} catch (err: any) {
			console.error(err)
			setStatus(`❌ ${err.message}`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
			<h1 className="text-2xl font-bold mb-4">Initialize GitHub Repository</h1>

			<input
				type="text"
				value={repoName}
				onChange={e => setRepoName(e.target.value)}
				placeholder="Repository name"
				className="border border-gray-300 rounded-lg w-full px-3 py-2"
			/>

			<input
				type="text"
				value={username}
				onChange={e => setUsername(e.target.value)}
				placeholder="GitHub username"
				className="border border-gray-300 rounded-lg w-full px-3 py-2"
			/>

			<input
				type="email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				placeholder="Email"
				className="border border-gray-300 rounded-lg w-full px-3 py-2"
			/>

			<input
				type="password"
				value={token}
				onChange={e => setToken(e.target.value)}
				placeholder="GitHub token (classic PAT)"
				className="border border-gray-300 rounded-lg w-full px-3 py-2"
			/>

			<button
				onClick={handleInit}
				disabled={loading}
				className="bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700 disabled:opacity-50"
			>
				{loading ? 'Initializing...' : 'Init & Push'}
			</button>

			{status && <p className="text-gray-700 whitespace-pre-wrap">{status}</p>}
		</div>
	)
}
