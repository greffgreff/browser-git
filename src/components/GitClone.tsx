import { useState } from 'react'
import * as git from 'https://esm.sh/isomorphic-git@1.27.1'
import http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'

export default function GitClone() {
	const [repoUrl, setRepoUrl] = useState('https://github.com/greffgreff/basic-worker')
	const [files, setFiles] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function handleClone() {
		if (!repoUrl) return
		setLoading(true)
		setError('')
		setFiles([])

		try {
			const fs = new LightningFS('fs')
			const pfs = fs.promises

			await git.clone({
				fs,
				http,
				dir: '/repo',
				url: repoUrl,
				corsProxy: 'https://cors.isomorphic-git.org',
				singleBranch: true,
				depth: 1
			})

			const list = await pfs.readdir('/repo')
			setFiles(list)
		} catch (err: any) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">Git Clone</h1>

			<div className="flex gap-2 mb-6">
				<input
					type="text"
					value={repoUrl}
					onChange={e => setRepoUrl(e.target.value)}
					className="border border-gray-300 rounded-lg px-4 py-2 w-96"
					placeholder="Enter Git repo URL"
				/>
				<button
					onClick={handleClone}
					disabled={loading}
					className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Cloning...' : 'Clone'}
				</button>
			</div>

			{error && <p className="text-red-500 mb-4">{error}</p>}

			{files.length > 0 && (
				<div className="bg-white shadow-md rounded-lg p-4 w-[500px]">
					<h4 className="text-lg font-semibold mb-2">Repo Files</h4>
					<ul className="list-disc pl-5">
						{files.map(f => (
							<li key={f}>{f}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
