import React, { useState, useEffect } from 'react'
import {
	LayoutGrid,
	Layers,
	Calendar,
	Plane,
	MessagesSquare,
	FolderOpen,
	Folder,
	UserRound,
	Video,
	TestTube,
	Users,
	UserRoundPlus,
	Database,
	GraduationCap,
	Menu,
	X,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import logo from '../assets/logo.png'
import { NavLink, useLocation } from 'react-router-dom'

const Aside = () => {
	const user = useSelector(state => state.auth.user)
	const location = useLocation()
	const [isOpen, setIsOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(window.innerWidth < 960)

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 960
			setIsMobile(mobile)
			if (!mobile) setIsOpen(false)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Close sidebar on route change (mobile)
	useEffect(() => {
		if (isMobile) setIsOpen(false)
	}, [location.pathname, isMobile])

	if (!user) return null

	const menusByRole = {
		mentor: [
			{ icon: LayoutGrid, label: 'Dashboard', path: '/mentor/' },
			{ icon: Layers, label: `O'quvchilar`, path: `/mentor/o'quvchilar` },
			{ icon: Video, label: `Google Meet`, path: `/mentor/google-meet` },
			{ icon: MessagesSquare, label: 'Guruhlar', path: '/mentor/guruhlar' },
			{ icon: FolderOpen, label: 'Sozlamalar', path: '/mentor/sozlamalar' },
		],
		headmentor: [
			{ icon: LayoutGrid, label: 'Dashboard', path: '/head-mentor/' },
			{ icon: Layers, label: 'Oquvchilar', path: `/head-mentor/o'quvchilar` },
			{ icon: Calendar, label: 'Kurslar', path: `/head-mentor/kurslar` },
			{ icon: Plane, label: 'Mentorlar', path: '/head-mentor/mentorlar' },
			{ icon: Calendar, label: 'Jadval', path: '/head-mentor/jadval' },
			{ icon: Layers, label: 'Materiallar', path: '/head-mentor/material' },
			{ icon: MessagesSquare, label: 'Guruhlar', path: '/head-mentor/guruhlar' },
			{ icon: FolderOpen, label: 'Hisobotlar', path: '/head-mentor/hisobotlar' },
			{ icon: FolderOpen, label: 'Sozlamalar', path: '/head-mentor/sozlamalar' },
		],
		admin: [
			{ icon: LayoutGrid, label: 'Dashboard', path: '/admin/' },
			{ icon: Layers, label: `O'quvchilar`, path: `/admin/o'quvchilar` },
			{ icon: Database, label: 'Kurslar', path: '/admin/kurslar' },
			{ icon: GraduationCap, label: 'Mentorlar', path: '/admin/mentorlar' },
			{ icon: UserRound, label: `To'lovlar`, path: `/admin/to'lovlar` },
			{ icon: Users, label: 'Guruhlar', path: '/admin/guruhlar' },
			{ icon: FolderOpen, label: 'Google Meet', path: '/admin/google-meet' },
			{ icon: FolderOpen, label: 'Bildirishnomalar', path: '/admin/bildirishnomalar' },
			{ icon: UserRoundPlus, label: `Yeg'ilish`, path: `/admin/yeg'ilish`, status: true },
		],
		superadmin: [
			{ icon: LayoutGrid, label: 'Dashboard', path: '/super-admin/' },
			{ icon: Layers, label: `Students`, path: `/super-admin/students` },
			{ icon: Calendar, label: 'Calendar', path: '/super-admin/calendar' },
			{ icon: Plane, label: 'Finance', path: '/super-admin/finance' },
			{ icon: MessagesSquare, label: 'Employees', path: '/super-admin/employees' },
			{ icon: FolderOpen, label: 'Marketing', path: '/super-admin/marketing' },
			{ icon: FolderOpen, label: 'Groups', path: '/super-admin/groups' },
			{ icon: FolderOpen, label: 'Sozlamalar', path: '/super-admin/sozlamalar' },
		],
		supportteacher: [
			{ icon: LayoutGrid, label: 'Dashboard', path: '/support-mentor/' },
		],
	}

	const menuItems = menusByRole[user.role.toLowerCase()] || []

	const navContent = (
		<>
			<div>
				<img src={logo} className='w-[130px]' alt='' />
			</div>
			<div className='gap-[15px] flex flex-col items-start w-full'>
				{menuItems.map((item, index) => {
					const Icon = item.icon
					const isActive = item.path === location.pathname
					return (
						<NavLink
							key={index}
							to={item.path}
							className={`flex items-center gap-[15px] w-full px-[8px] py-[10px] rounded-[10px] transition-colors duration-200 ${
								isActive ? 'bg-[#ebf3ff]' : 'bg-white hover:bg-gray-50'
							}`}
						>
							<Icon
								className={isActive ? 'text-[#3F8CFF]' : 'text-[#7D8592]'}
								size={24}
							/>
							<p className={`font-[Nunito Sans] font-[600] ${isActive ? 'text-[#3F8CFF]' : 'text-[#7D8592]'}`}>
								{item.label}
							</p>
						</NavLink>
					)
				})}
			</div>
		</>
	)

	// ─── DESKTOP sidebar (≥960px) ─────────────────────────────────────────────
	if (!isMobile) {
		return (
			<aside className='w-[207px] bg-white h-screen px-[15px] py-[40px] flex flex-col items-start gap-[42px] fixed top-0 left-0'>
				{navContent}
			</aside>
		)
	}

	// ─── MOBILE burger (<960px) ───────────────────────────────────────────────
	return (
		<>
			{/* Burger button */}
			<button
				onClick={() => setIsOpen(true)}
				className='fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-[#3F8CFF]'
				aria-label='Open menu'
			>
				<Menu size={22} />
			</button>

			{/* Backdrop */}
			<div
				onClick={() => setIsOpen(false)}
				className='fixed inset-0 z-40 transition-all duration-300'
				style={{
					backgroundColor: isOpen ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
					pointerEvents: isOpen ? 'auto' : 'none',
				}}
			/>

			{/* Drawer */}
			<aside
				className='fixed top-0 left-0 h-screen w-[207px] bg-white z-50 px-[15px] py-[40px] flex flex-col items-start gap-[42px] shadow-2xl'
				style={{
					transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
					transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				}}
			>
				{/* Close button */}
				<button
					onClick={() => setIsOpen(false)}
					className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#7D8592] hover:text-[#3F8CFF] transition-colors'
					aria-label='Close menu'
				>
					<X size={20} />
				</button>

				{navContent}
			</aside>
		</>
	)
}

export default Aside