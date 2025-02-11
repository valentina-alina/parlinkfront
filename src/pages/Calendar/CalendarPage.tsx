/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAds, getAdById, getAdsByParams, getCategories, getSubCategories, getAdsByCategories, getAdsBySubCategories } from '../../services/api/ads';
// import MapButton from '../../components/Map/MapButton';
import Sidebar from '../../components/Calendar/Sidebar';
import FullCalendar from '../../components/Calendar/FullCalendar';
import { EventInput } from '@fullcalendar/core';
import {  useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { Label, TextInput } from 'flowbite-react';
// import fakerCategories from '../Ads/fakerCategories';
// import { HiSearch } from "react-icons/hi";
// import { debounce } from '../../services/utils/debounce';
import FixedHeader from '../../components/Header/FixedHeader';

type Category = string;

export default function CalendarPage({ searchQuery }: { searchQuery: string }) {
    // const [localSearchQuery, setLocalSearchQuery] = useState<string>('');  
      const [localSearchQuery] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [adsList, setAdsList] = useState<any[]>([]);
    const [showWeekNumbers, setShowWeekNumbers] = useState(true);
    const [mobileView, setMobileView] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState<boolean>(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Record<Category, string[]>>({});
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        fetchAds();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (id) {
            fetchAdDetails(id);
        }
    }, [id]);

    useEffect(() => {        
        fetchFilteredAds();
    }, [selectedCategories, localSearchQuery, searchQuery]);

    useEffect(() => {
        const handleResize = () => {
            setShowWeekNumbers(window.innerWidth >= 640);
            setMobileView(window.innerWidth < 640);
        };

        window.addEventListener('resize', handleResize);

        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAds = async () => {
        const ads = await getAds();
        setAdsList(ads);
    };

    const fetchFilteredAds = async () => {
        try {
            const query = localSearchQuery || searchQuery || '';
            let response = await getAdsByParams(query);

            if (isAllSelected || selectedCategories.length === 0) {
                response = await getAdsByParams(query);
            } else {
                const categoryAds = await Promise.all(
                    selectedCategories.map(category => getAdsByCategories(category))
                );
                const ads = categoryAds.flatMap(category => category.data.ads);
                response = { data: { ads } };
            }

            const fetchedAds = response.data.ads;

            if (!Array.isArray(fetchedAds)) {
                console.error(`Attendait une liste d'annonces mais a reçu:`, fetchedAds);
                return;
            }

            const adsWithParsedDates = fetchedAds.map((ad: any) => ({
                ...ad,
                startTime: new Date(ad.startTime),
                endTime: new Date(ad.endTime),
            }));

            setAdsList(adsWithParsedDates);
        } catch (error) {
            console.error(`Erreur lors de la récupération des annonces:`, error);
        }
    };

    const handleCategoryChange = async (category: Category) => {
        if (category === 'all') {
            setSelectedCategories([]);
            setIsAllSelected(true);
        } else {
            setIsAllSelected(false);
            setSelectedCategories((prevCategories) =>
                prevCategories.includes(category)
                    ? prevCategories.filter((c) => c !== category)
                    : [...prevCategories, category]
            );
        }

        await fetchFilteredAds();
    };

    const handleSubCategoryChange = async (subCategory: string) => {
        try {
            const response = await getAdsBySubCategories(subCategory);
            const fetchedAds = response.data.ads;

            if (!Array.isArray(fetchedAds)) {
                console.error(`Attendait une liste d'annonces mais a reçu:`, fetchedAds);
                return;
            }

            setAdsList(fetchedAds);
        } catch (error) {
            console.error(`Erreur lors de la récupération des annonces pour la sous-catégorie ${subCategory}:`, error);
        }
    };


    const handleCategoryHover = async (category: Category) => {
        try {
            const response = await getSubCategories(category);
            if (response && response.data && Array.isArray(response.data.subCategories)) {
                setSubCategories((prevSubCategories) => ({
                ...prevSubCategories,
                [category]: response.data.subCategories,
                }));
            } else {
                console.warn(`Réponse inattendue pour les sous-catégories de la catégorie ${category}:`, response);
                setSubCategories((prevSubCategories) => ({
                    ...prevSubCategories,
                    [category]: [],
                }));
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des sous-catégories de la catégorie ${category}:`, error);
            setSubCategories((prevSubCategories) => ({
            ...prevSubCategories,
            [category]: [],
            }));
        }
    };

    // const debouncedHandleSearchChange = useCallback(debounce((query: string) => {
    //     setLocalSearchQuery(query);
    // }, 500), []);

    // const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const { value } = event.target;
    //     debouncedHandleSearchChange(value);
    // };

    const eventInputs: EventInput[] = adsList.map((event: any) => ({
        id: String(event.id),
        title: event.title,
        start: event.startTime,
        end: event.endTime,
    }));

    const navigate = useNavigate();

    const handleEventClick = (eventClickInfo: any) => {
        const eventId = eventClickInfo.event.id;
        navigate(`/ad/${eventId}`);
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            const fetchedCategories = response.data.categories;

            setCategories(['all', ...fetchedCategories]);
            console.log(`Catégories récupérées:`, fetchedCategories);
        } catch (error) {
            console.error(`Erreur lors de la récupération des catégories:`, error);
        }
    };

    const fetchAdDetails = async (id: string) => {
        try {
            const adDetails = await getAdById(id);
            console.log(`Détails de l'annonce:`, adDetails);

        } catch (error) {
            console.error(`Erreur lors de la récupération des détails de l'annonce avec l'id ${id}:`, error);
        }
    };

    return (
        <>
        <FixedHeader
                categories={categories}
                selectedCategories={selectedCategories}
                isAllSelected={isAllSelected}
                subCategories={subCategories}
                handleCategoryChange={handleCategoryChange}
                handleCategoryHover={handleCategoryHover}
                handleSubCategoryChange={handleSubCategoryChange}
            />
    <div className="pt-[128px] p-4" >
            {
                !adsList || adsList.length === 0 ? (
                    <p className='font-bodyTest text-2xl my-32 italic text-orange-500'>
                        Nous n'avons pas trouvé d'évènement.
                    </p>
                ) : (
                    <h1 className="font-titleTest text-xl my-4">
                        Calendrier des annonces
                    </h1>
                )
            }

            <div className="flex flex-wrap gap-8 overflow-hidden">
                <div className={`w-full ${mobileView ? 'p-0' : ''}`}>
                    <FullCalendar
                        mobileView={mobileView}
                        showWeekNumbers={showWeekNumbers}
                        eventInputs={eventInputs}
                        handleEventClick={handleEventClick}
                    />
                </div>
                <div className="w-full mt-10 sm:mt-0">
                    <Sidebar
                        events={adsList}
                    />
                </div>
                {/* <MapButton /> */}
            </div>
            </div>
        </>
    );
}