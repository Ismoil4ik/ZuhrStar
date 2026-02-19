import React from 'react'
import Aside from '../components/Aside'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const HeadMentorLayout = () => {
	return (
		<div className='flex min-h-screen bg-[#f3f9fe]'>
			<Aside />
			<div className='flex flex-col w-full min-h-screen ml-0 min-[960px]:ml-[207px]'>
				<Navbar />
				<Outlet />
			</div>
		</div>
	)
}

export default HeadMentorLayout