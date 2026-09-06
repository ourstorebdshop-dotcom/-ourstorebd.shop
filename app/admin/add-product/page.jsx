'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState, useCallback } from "react"
import { toast } from "react-hot-toast"
import { XIcon, PlusIcon, Clock, TrendingUp, CheckIcon, Loader2Icon } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { addProduct } from "@/lib/features/product/productSlice"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/imageCompressor"
import { saveDocToFirestore } from "@/lib/firestore"

export default function AdminAddProduct() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const router = useRouter()

    // Dynamic categories from Redux store (sorted by order, only visible ones)
    const reduxCategories = useSelector(state => state.category?.categories || [])
    const categoryList = [...reduxCategories]
        .filter(c => c.visible)
        .sort((a, b) => a.order - b.order)
        .map(c => c.name)

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [imagePreviews, setImagePreviews] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: "",
        price: "",
    })
    // Multi-category selection
    const [selectedCategories, setSelectedCategories] = useState([])
    // Homepage section toggles (default ON)
    const [sections, setSections] = useState({ latest: true, bestSelling: true })
    const [colors, setColors] = useState([])
    const [sizes, setSizes] = useState([])
    const [colorInput, setColorInput] = useState("#000000")
    const [sizeInput, setSizeInput] = useState("")
    const [loading, setLoading] = useState(false)

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    // Toggle category selection
    const toggleCategory = (catName) => {
        setSelectedCategories(prev =>
            prev.includes(catName)
                ? prev.filter(c => c !== catName)
                : [...prev, catName]
        )
    }

    // Toggle section
    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const addColor = () => {
        if (colorInput && !colors.includes(colorInput)) {
            setColors([...colors, colorInput])
        }
    }

    const removeColor = (colorToRemove) => {
        setColors(colors.filter(c => c !== colorToRemove))
    }

    const addSize = () => {
        const trimmed = sizeInput.trim()
        if (trimmed && !sizes.includes(trimmed)) {
            setSizes([...sizes, trimmed])
            setSizeInput("")
        }
    }

    const handleSizeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addSize()
        }
    }

    const removeSize = (sizeToRemove) => {
        setSizes(sizes.filter(s => s !== sizeToRemove))
    }

    const handleImageChange = useCallback((key, file) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file)
            setImagePreviews(prev => {
                if (prev[key]) URL.revokeObjectURL(prev[key])
                return { ...prev, [key]: previewUrl }
            })
            setImages(prev => ({ ...prev, [key]: file }))
        } else {
            setImagePreviews(prev => {
                if (prev[key]) URL.revokeObjectURL(prev[key])
                return { ...prev, [key]: null }
            })
            setImages(prev => ({ ...prev, [key]: null }))
        }
    }, [])

    // Remove a selected image
    const removeImage = (key) => {
        setImagePreviews(prev => {
            if (prev[key]) URL.revokeObjectURL(prev[key])
            return { ...prev, [key]: null }
        })
        setImages(prev => ({ ...prev, [key]: null }))
        // Reset the file input so the same file can be selected again
        const input = document.getElementById(`images${key}`)
        if (input) input.value = ''
    }


    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            // Get selected image files
            const imageFiles = Object.values(images).filter(Boolean)
            
            if (imageFiles.length === 0) {
                toast.error('অন্তত একটি ছবি আপলোড করুন')
                setLoading(false)
                return
            }

            if (selectedCategories.length === 0) {
                toast.error('অন্তত একটি ক্যাটাগরি সিলেক্ট করুন')
                setLoading(false)
                return
            }

            if (!productInfo.name.trim()) {
                toast.error('প্রোডাক্টের নাম দিন')
                setLoading(false)
                return
            }

            const mrpValue = parseFloat(productInfo.mrp)
            const priceValue = parseFloat(productInfo.price)

            if (!mrpValue || mrpValue <= 0) {
                toast.error('সঠিক Actual Price দিন')
                setLoading(false)
                return
            }

            if (!priceValue || priceValue <= 0) {
                toast.error('সঠিক Offer Price দিন')
                setLoading(false)
                return
            }

            if (priceValue > mrpValue) {
                toast.error('Offer Price, Actual Price-এর চেয়ে বেশি হতে পারে না')
                setLoading(false)
                return
            }

            // Convert and compress images to compact WebP/JPEG (prevents Firestore 1MB limit)
            const imageDataUrls = await Promise.all(imageFiles.map(file => compressImage(file, 800, 800, 0.75)))

            // Build sections array
            const activeSections = []
            if (sections.latest) activeSections.push('latest')
            if (sections.bestSelling) activeSections.push('bestSelling')

            const newProduct = {
                id: `prod_${Date.now()}`,
                name: productInfo.name.trim(),
                description: productInfo.description.trim(),
                mrp: mrpValue,
                price: priceValue,
                images: imageDataUrls,
                category: selectedCategories[0], // Primary category (backward compat)
                categories: selectedCategories,   // All selected categories
                sections: activeSections,         // Homepage sections
                colors: colors,
                sizes: sizes,
                inStock: true,
                rating: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            // Save immediately to Firestore (syncs across the entire world instantly)
            await saveDocToFirestore('products', newProduct.id, newProduct)

            dispatch(addProduct(newProduct))

            // Immediate localStorage cache update for 0ms instant display
            try {
                const saved = localStorage.getItem('gocart_products')
                const currentList = saved ? JSON.parse(saved) : []
                if (Array.isArray(currentList)) {
                    localStorage.setItem('gocart_products', JSON.stringify([newProduct, ...currentList]))
                }
            } catch (err) { /* ignore */ }
            
            // Cleanup preview URLs before resetting
            Object.values(imagePreviews).forEach(url => {
                if (url) URL.revokeObjectURL(url)
            })

            // Reset form
            setProductInfo({ name: '', description: '', mrp: '', price: '' })
            setSelectedCategories([])
            setSections({ latest: true, bestSelling: true })
            setColors([])
            setSizes([])
            setImages({ 1: null, 2: null, 3: null, 4: null })
            setImagePreviews({ 1: null, 2: null, 3: null, 4: null })
            // Clear file inputs so the same file can be re-selected
            Object.keys(images).forEach(key => {
                const input = document.getElementById(`images${key}`)
                if (input) input.value = ''
            })
            setLoading(false)
            
            toast.success(`"${newProduct.name}" সফলভাবে যোগ করা হয়েছে!`)
            router.push('/admin/manage-product')
        } catch (err) {
            console.error('Error adding product:', err)
            toast.error('প্রোডাক্ট যোগ করতে সমস্যা হয়েছে')
            setLoading(false)
        }
    }


    return (
        <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <div key={key} className="relative group">
                        <label htmlFor={`images${key}`} className="cursor-pointer">
                            <Image
                                width={300}
                                height={300}
                                className='h-15 w-auto border border-slate-200 rounded'
                                src={imagePreviews[key] || assets.upload_area}
                                alt={`Product image ${key}`}
                            />
                            <input
                                type="file"
                                accept='image/*'
                                id={`images${key}`}
                                onChange={e => handleImageChange(key, e.target.files[0])}
                                hidden
                            />
                        </label>
                        {/* Remove image button — appears on hover */}
                        {images[key] && (
                            <button
                                type="button"
                                onClick={() => removeImage(key)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                            >
                                <XIcon size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <label className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2 ">
                    Actual Price ({currency})
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" min="1" step="any" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
                </label>
                <label className="flex flex-col gap-2 ">
                    Offer Price ({currency})
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" min="1" step="any" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
                </label>
            </div>

            {/* Homepage Section Selection */}
            <div className="my-6 max-w-lg">
                <p className="mb-3 font-medium text-slate-700">হোমপেজ সেকশন</p>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => toggleSection('latest')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                            sections.latest
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            sections.latest ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}>
                            {sections.latest && <CheckIcon size={13} className="text-white" strokeWidth={3} />}
                        </div>
                        <Clock size={15} />
                        Latest Products
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleSection('bestSelling')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                            sections.bestSelling
                                ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            sections.bestSelling ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                        }`}>
                            {sections.bestSelling && <CheckIcon size={13} className="text-white" strokeWidth={3} />}
                        </div>
                        <TrendingUp size={15} />
                        Best Selling
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">হোমপেজের কোন সেকশনে এই প্রোডাক্ট দেখাবে সিলেক্ট করুন</p>
            </div>

            {/* Multi-Category Selection */}
            <div className="my-6 max-w-lg">
                <p className="mb-3 font-medium text-slate-700">
                    ক্যাটাগরি সিলেক্ট করুন
                    {selectedCategories.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {selectedCategories.length}টি সিলেক্টেড
                        </span>
                    )}
                </p>
                <div className="flex flex-wrap gap-2">
                    {categoryList.map((catName) => {
                        const isSelected = selectedCategories.includes(catName)
                        return (
                            <button
                                type="button"
                                key={catName}
                                onClick={() => toggleCategory(catName)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
                                    isSelected
                                        ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                                    isSelected ? 'bg-green-600 border-green-600' : 'border-slate-300'
                                }`}>
                                    {isSelected && <CheckIcon size={11} className="text-white" strokeWidth={3} />}
                                </div>
                                {catName}
                            </button>
                        )
                    })}
                </div>
                {categoryList.length === 0 && (
                    <p className="text-xs text-red-400 mt-2">কোনো ক্যাটাগরি পাওয়া যায়নি। আগে Categories পেজ থেকে ক্যাটাগরি যোগ করুন।</p>
                )}
                <p className="text-xs text-slate-400 mt-2">একাধিক ক্যাটাগরি সিলেক্ট করতে পারবেন — প্রোডাক্ট সব সিলেক্টেড ক্যাটাগরিতে দেখাবে</p>
            </div>

            {/* Colors Section */}
            <div className="my-6 max-w-sm">
                <p className="mb-2 font-medium text-slate-700">Colors</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {colors.map((color) => (
                        <span key={color} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full pl-1.5 pr-2 py-1 text-xs">
                            <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-slate-600">{color}</span>
                            <button type="button" onClick={() => removeColor(color)} className="text-slate-400 hover:text-red-500 transition">
                                <XIcon size={14} />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder="#000000"
                        className="w-28 p-2 px-3 text-sm outline-none border border-slate-200 rounded"
                    />
                    <button type="button" onClick={addColor} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-2 text-sm rounded hover:bg-slate-900 transition">
                        <PlusIcon size={16} /> Add
                    </button>
                </div>
            </div>

            {/* Sizes Section */}
            <div className="my-6 max-w-sm">
                <p className="mb-2 font-medium text-slate-700">Sizes</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {sizes.map((size) => (
                        <span key={size} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700">
                            {size}
                            <button type="button" onClick={() => removeSize(size)} className="text-slate-400 hover:text-red-500 transition">
                                <XIcon size={14} />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={handleSizeKeyDown}
                        placeholder="e.g. S, M, L, XL, 40mm..."
                        className="flex-1 p-2 px-3 text-sm outline-none border border-slate-200 rounded"
                    />
                    <button type="button" onClick={addSize} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-2 text-sm rounded hover:bg-slate-900 transition">
                        <PlusIcon size={16} /> Add
                    </button>
                </div>
            </div>

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2.5 hover:bg-slate-900 rounded transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                    <>
                        <Loader2Icon size={16} className="animate-spin" />
                        Adding...
                    </>
                ) : (
                    'Add Product'
                )}
            </button>
        </form>
    )
}

