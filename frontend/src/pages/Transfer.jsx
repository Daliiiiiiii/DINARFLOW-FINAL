import { motion } from 'framer-motion'
import TransferForm from '../components/forms/TransferForm'
import Card from '../components/ui/Card'
import { typography } from '../styles/typography'
import { RiExchangeDollarLine } from 'react-icons/ri'

const Transfer = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-4">
          <RiExchangeDollarLine className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h1 className={typography.h1}>Transfer Money</h1>
          <p className={typography.muted.base}>Send money to other users quickly and securely</p>
        </div>
      </div>

      {/* Transfer Form */}
      <Card>
        <div className="p-6">
          <TransferForm />
        </div>
      </Card>
    </motion.div>
  )
}

export default Transfer