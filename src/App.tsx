import GitClone from './components/GitClone'
import GitInit from './components/GitInit'

export default function App() {
	return (
		<div className="p-10 space-y-10">
			<GitClone />
			<hr className="border-gray-300" />
			<GitInit />
		</div>
	)
}
