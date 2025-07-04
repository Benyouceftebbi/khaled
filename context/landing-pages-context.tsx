"use client"

import type { ReactNode, FC } from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Updated product inventory with more variant details
const productInventory = [
  {
    id: "prod_1",
    name: "Classic Cotton Tee",
    variants: [
      {
        id: "var_1a",
        name: "Red - S",
        price: 25.0,
        color: "Red",
        size: "S",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
      {
        id: "var_1b",
        name: "Red - M",
        price: 25.0,
        color: "Red",
        size: "M",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
      {
        id: "var_1c",
        name: "Blue - M",
        price: 25.0,
        color: "Blue",
        size: "M",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
    ],
  },
  {
    id: "prod_2",
    name: "Aero-Boost X1 Sneakers",
    variants: [
      {
        id: "var_2a",
        name: "Black - 9",
        price: 120.0,
        color: "Black",
        size: "9",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
      {
        id: "var_2b",
        name: "White - 9.5",
        price: 120.0,
        color: "White",
        size: "9.5",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
      {
        id: "var_2c",
        name: "White - 10",
        price: 120.0,
        color: "White",
        size: "10",
        imageUrl: "/placeholder.svg?width=100&height=100",
      },
    ],
  },
]

interface LandingPage {
  id: string
  [key: string]: any
}

interface ProductVariant {
  id: string
  name: string
  price: number
  color: string
  size: string
  imageUrl: string
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

interface LandingPagesContextType {
  landingPages: LandingPage[]
  products: Product[]
  loading: boolean
  addLandingPage: (data: any) => Promise<void>
  updateLandingPage: (id: string, data: any) => Promise<void>
  deleteLandingPage: (id: string) => Promise<void>
}

const LandingPagesContext = createContext<LandingPagesContextType | undefined>(undefined)

export const LandingPagesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const landingPagesCollection = collection(db, "landingPages")
    const unsubscribe = onSnapshot(landingPagesCollection, (snapshot) => {
      const pagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setLandingPages(pagesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addLandingPage = async (data: any) => {
    try {
      const landingPagesCollection = collection(db, "landingPages")
      await addDoc(landingPagesCollection, {
        ...data,
        logoUrl:'test',
        createdAt: serverTimestamp(),
      })
      toast({ title: "Success", description: "Landing page created successfully." })
      router.push("/admin/landing-pages")
    } catch (error) {
      console.error("Error adding document: ", error)
      toast({
        title: "Error",
        description: "Failed to create landing page.",
        variant: "destructive",
      })
    }
  }

  const updateLandingPage = async (id: string, data: any) => {
    try {
      const pageDoc = doc(db, "landingPages", id)
      await updateDoc(pageDoc, {
        ...data,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Success", description: "Landing page updated successfully." })
      router.push("/admin/landing-pages")
    } catch (error) {
      console.error("Error updating document: ", error)
      toast({
        title: "Error",
        description: "Failed to update landing page.",
        variant: "destructive",
      })
    }
  }

  const deleteLandingPage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this landing page?")) {
      try {
        const pageDoc = doc(db, "landingPages", id)
        await deleteDoc(pageDoc)
        toast({ title: "Success", description: "Landing page deleted." })
      } catch (error) {
        console.error("Error deleting document: ", error)
        toast({
          title: "Error",
          description: "Failed to delete landing page.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <LandingPagesContext.Provider
      value={{
        landingPages,
        products: productInventory,
        loading,
        addLandingPage,
        updateLandingPage,
        deleteLandingPage,
      }}
    >
      {children}
    </LandingPagesContext.Provider>
  )
}

export const useLandingPages = () => {
  const context = useContext(LandingPagesContext)
  if (context === undefined) {
    throw new Error("useLandingPages must be used within a LandingPagesProvider")
  }
  return context
}
