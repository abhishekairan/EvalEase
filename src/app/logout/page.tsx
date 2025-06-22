import { logoutAction } from '@/actions/logout'
import React from 'react'

const page = async () => {
    await logoutAction()
  return (
    <div>
      Logout
    </div>
  )
}

export default page
