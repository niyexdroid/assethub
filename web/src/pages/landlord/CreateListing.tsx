import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListingForm, formDataToPayload, type PropertyFormData } from '@/components/listings/ListingForm'
import { propertiesService } from '@/services/properties.service'

export default function CreateListing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: PropertyFormData) => {
    setLoading(true)
    try {
      await propertiesService.create(formDataToPayload(data))
      navigate('/landlord/listings')
    } catch (err) {
      setLoading(false)
      throw err // let ListingForm show the error
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Create Listing</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new property to your portfolio.</p>
      </div>
      <ListingForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/landlord/listings')}
        submitLabel="Create Listing"
        loading={loading}
      />
    </div>
  )
}
