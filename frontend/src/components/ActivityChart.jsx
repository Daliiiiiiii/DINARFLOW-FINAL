import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useTheme } from '../contexts/ThemeContext'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export const ActivityChart = ({ data = [], timeframe = 'week' }) => {
  const { isDarkMode } = useTheme()
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    const processData = () => {
      const now = new Date()
      let labels = []
      let sentData = []
      let receivedData = []
      
      // Generate date labels based on timeframe
      switch(timeframe) {
        case 'week':
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))
            sentData.push(0)
            receivedData.push(0)
          }
          break
          
        case 'month':
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            labels.push(date.toLocaleDateString('en-US', { day: 'numeric' }))
            sentData.push(0)
            receivedData.push(0)
          }
          break
          
        case 'year':
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now)
            date.setMonth(date.getMonth() - i)
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }))
            sentData.push(0)
            receivedData.push(0)
          }
          break
      }

      // Process transaction data
      data.forEach(transaction => {
        const date = new Date(transaction.timestamp)
        let index = -1
        
        switch(timeframe) {
          case 'week':
            index = labels.indexOf(date.toLocaleDateString('en-US', { weekday: 'short' }))
            break
          case 'month':
            index = labels.indexOf(date.toLocaleDateString('en-US', { day: 'numeric' }))
            break
          case 'year':
            index = labels.indexOf(date.toLocaleDateString('en-US', { month: 'short' }))
            break
        }
        
        if (index !== -1) {
          if (transaction.type === 'sent') {
            sentData[index] += transaction.amount
          } else if (transaction.type === 'received') {
            receivedData[index] += transaction.amount
          }
        }
      })

      setChartData({
        labels,
        datasets: [
          {
            label: 'Sent',
            data: sentData,
            borderColor: isDarkMode ? 'rgba(248, 113, 113, 1)' : 'rgb(239, 68, 68)',
            backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.05)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: isDarkMode ? 'rgba(248, 113, 113, 1)' : 'rgb(239, 68, 68)',
            pointBorderColor: isDarkMode ? '#fff' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Received',
            data: receivedData,
            borderColor: isDarkMode ? 'rgba(74, 222, 128, 1)' : 'rgb(34, 197, 94)',
            backgroundColor: isDarkMode ? 'rgba(74, 222, 128, 0.15)' : 'rgba(34, 197, 94, 0.05)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: isDarkMode ? 'rgba(74, 222, 128, 1)' : 'rgb(34, 197, 94)',
            pointBorderColor: isDarkMode ? '#fff' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      })
    }

    processData()
  }, [data, timeframe, isDarkMode])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#F3F4F6' : '#374151',
          font: {
            family: "'Inter', sans-serif",
            weight: 500
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#F3F4F6' : '#374151',
        bodyColor: isDarkMode ? '#F3F4F6' : '#374151',
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(203, 213, 225, 0.5)',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: "'Inter', sans-serif"
        },
        titleFont: {
          family: "'Inter', sans-serif",
          weight: 600
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'TND'
              }).format(context.parsed.y)
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(203, 213, 225, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#E5E7EB' : '#374151',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(203, 213, 225, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#E5E7EB' : '#374151',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'TND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default ActivityChart 